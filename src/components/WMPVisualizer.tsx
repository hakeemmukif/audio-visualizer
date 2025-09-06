'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WMPVisualizerProps {
  width?: number;
  height?: number;
  visualizerType?: 'bars' | 'circular';
  renderMode?: 'webgl' | 'canvas';
}

export const WMPVisualizer: React.FC<WMPVisualizerProps> = ({
  width = 700,
  height = 500,
  visualizerType = 'bars',
  renderMode = 'canvas'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasAudio, setHasAudio] = useState(false);

  // Expose functions globally for PlayerControls to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).wmpVisualizer = {
        loadAudio: loadAudio,
        play: play,
        pause: pause,
        stop: stop,
        setVolume: (vol: number) => {
          setVolume(vol);
          if (audioElementRef.current) {
            audioElementRef.current.volume = vol;
          }
        },
        seek: (time: number) => {
          if (audioElementRef.current) {
            audioElementRef.current.currentTime = time;
          }
        },
        getCurrentTime: () => currentTime,
        getDuration: () => duration,
        getVolume: () => volume,
        isPlaying: () => isPlaying,
        getAnalyser: () => analyserRef.current
      };
    }
  }, [currentTime, duration, volume, isPlaying]);

  const loadAudio = async (file: File) => {
    try {
      // Cleanup existing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      // Create new audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioElementRef.current = new Audio();
      audioElementRef.current.crossOrigin = 'anonymous';

      const url = URL.createObjectURL(file);
      audioElementRef.current.src = url;

      return new Promise<void>((resolve) => {
        if (!audioElementRef.current) return;
        
        audioElementRef.current.addEventListener('loadeddata', () => {
          console.log('✅ WMP Visualizer: Audio loaded');
          setupAudioGraph();
          setHasAudio(true);
          setDuration(audioElementRef.current?.duration || 0);
          resolve();
        }, { once: true });

        // Update time during playback
        audioElementRef.current.addEventListener('timeupdate', () => {
          setCurrentTime(audioElementRef.current?.currentTime || 0);
        });

        // Handle play/pause state changes
        audioElementRef.current.addEventListener('play', () => setIsPlaying(true));
        audioElementRef.current.addEventListener('pause', () => setIsPlaying(false));
        audioElementRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
      });
    } catch (error) {
      console.error('❌ WMP Visualizer: Failed to load audio:', error);
    }
  };

  const setupAudioGraph = () => {
    if (!audioElementRef.current || !audioContextRef.current) return;

    try {
      // Create audio source
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
      
      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Create gain node
      gainNodeRef.current = audioContextRef.current.createGain();
      
      // Connect: source -> analyser -> gain -> destination
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      console.log('✅ WMP Visualizer: Audio graph connected');
    } catch (error) {
      console.error('❌ WMP Visualizer: Failed to setup audio graph:', error);
    }
  };

  const renderVisualization = useCallback(() => {
    if (visualizerType === 'circular') {
      renderCircular();
    } else {
      renderBars();
    }
  }, [visualizerType]);
  
  // Static render for when audio is not loaded/playing
  const renderStatic = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (visualizerType === 'circular') {
      // Draw static circular visualization
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.4;
      
      // Draw static circle
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw center dot
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw outer reference ring
      const maxRadius = Math.min(centerX, centerY) * 0.8;
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    // For bars mode, just keep it black (no static pattern needed)
  };

  const renderBars = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(frequencyData);

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Check if audio is actually playing (not React state)
    const audioActuallyPlaying = audioElementRef.current && 
                                !audioElementRef.current.paused;

    if (audioActuallyPlaying) {
      // Calculate bars
      const barCount = 64;
      const usableWidth = canvas.width * 0.9;
      const barWidth = usableWidth / barCount;
      const maxBarHeight = canvas.height * 0.8;
      const startX = (canvas.width - usableWidth) / 2;

      // Check if we have any frequency data
      const maxFreq = Math.max(...frequencyData);
      
      console.log(`🎵 Render: maxFreq=${maxFreq}, playing=${audioActuallyPlaying}`);

      if (maxFreq > 0) {
        // Draw bars with WMP green color
        ctx.fillStyle = '#00ff00';
        for (let i = 0; i < barCount; i++) {
          const freq = frequencyData[Math.floor(i * frequencyData.length / barCount)];
          const barHeight = (freq / 255) * maxBarHeight;
          
          const x = startX + i * barWidth;
          const y = canvas.height - barHeight;
          
          ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
      } else {
        // Draw test bars if no frequency data
        ctx.fillStyle = '#004400';
        for (let i = 0; i < barCount; i++) {
          const testHeight = Math.sin(Date.now() * 0.01 + i * 0.2) * 50 + 60;
          const x = startX + i * barWidth;
          const y = canvas.height - testHeight;
          ctx.fillRect(x, y, barWidth - 1, testHeight);
        }
      }
    }
    
    // Continue animation loop regardless
    animationFrameRef.current = requestAnimationFrame(renderVisualization);
  };

  const renderCircular = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.4;

    // Check if audio is actually playing
    const audioActuallyPlaying = audioElementRef.current && 
                                !audioElementRef.current.paused;

    if (audioActuallyPlaying) {
      const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(frequencyData);
      
      const maxFreq = Math.max(...frequencyData);
      console.log(`🌀 Circular Render: maxFreq=${maxFreq}, playing=${audioActuallyPlaying}`);

      if (maxFreq > 0) {
        // Draw circular waveform based on frequency data
        const points = 64;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const freqIndex = Math.floor((i / points) * frequencyData.length);
          const amplitude = frequencyData[freqIndex] / 255;
          const radius = baseRadius + amplitude * baseRadius * 0.8;
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.stroke();

        // Add center glow based on overall amplitude
        const avgAmplitude = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length / 255;
        if (avgAmplitude > 0.1) {
          const glowRadius = baseRadius * 0.3 * avgAmplitude;
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
          );
          
          gradient.addColorStop(0, `rgba(0, 255, 0, ${avgAmplitude * 0.6})`);
          gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Draw animated test pattern when playing but no frequency data
        const time = Date.now() * 0.003;
        const points = 64;
        
        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const waveOffset = Math.sin(time + i * 0.2) * 30;
          const radius = baseRadius + waveOffset;
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.stroke();
      }
    } else {
      // Draw static circle when not playing
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Always draw center dot
    ctx.fillStyle = audioActuallyPlaying ? '#00ff00' : 'rgba(0, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer reference ring
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    ctx.strokeStyle = audioActuallyPlaying ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(renderVisualization);
  };

  const play = async () => {
    if (!audioElementRef.current || !audioContextRef.current) return;

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      await audioElementRef.current.play();
      console.log('▶️ WMP Visualizer: Playing');
      
      // Always start the render loop when playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderVisualization();
    } catch (error) {
      console.error('❌ WMP Visualizer: Play error:', error);
    }
  };

  const pause = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      console.log('⏸️ WMP Visualizer: Paused');
    }
  };

  const stop = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      console.log('⏹️ WMP Visualizer: Stopped');
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Render static visualization
    renderStatic();
  };

  // Handle visualization type changes - restart render loop
  useEffect(() => {
    // Cancel existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Restart with correct renderer
    if (isPlaying && audioElementRef.current && !audioElementRef.current.paused) {
      renderVisualization();
    } else {
      renderStatic();
    }
  }, [visualizerType, renderVisualization]);

  // Start render loop on mount and cleanup on unmount
  useEffect(() => {
    // Start with static render if no audio is playing
    if (!isPlaying) {
      renderStatic();
    } else if (!animationFrameRef.current) {
      renderVisualization();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="wmp-visualization-container relative">
      {/* WMP-style title bar */}
      <div className="wmp-panel flex items-center justify-between px-3 py-1 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
          <span className="text-xs text-white font-medium">
            {visualizerType === 'bars' ? 'Frequency Bars' : 'Circular Wave'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-300">
            {renderMode.toUpperCase()}
          </div>
          <div className={`w-2 h-2 rounded-full ${
            isPlaying ? 'bg-green-400' : 'bg-gray-500'
          }`}></div>
        </div>
      </div>

      {/* Visualization window */}
      <div className="wmp-visualization relative p-2">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block mx-auto"
          style={{ 
            background: 'black',
            width: `${width}px`,
            height: `${height}px`,
            border: '1px solid #666'
          }}
        />
      </div>

      {/* Status bar */}
      <div className="wmp-status-bar flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span className={`${isPlaying ? 'text-green-400' : 'text-gray-400'}`}>
            {isPlaying ? 'Playing' : hasAudio ? 'Stopped' : 'No Audio'}
          </span>
          {hasAudio && duration > 0 && (
            <span className="text-gray-300">
              {Math.round(currentTime)}s / {Math.round(duration)}s
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">FPS: 60</span>
          <span className="text-gray-400">Vol: {Math.round(volume * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default WMPVisualizer;