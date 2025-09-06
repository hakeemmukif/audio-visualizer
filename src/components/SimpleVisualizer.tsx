'use client';

import React, { useRef, useEffect } from 'react';

export const SimpleVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Expose to window for testing
    if (typeof window !== 'undefined') {
      (window as unknown as { simpleVisualizer: unknown }).simpleVisualizer = {
        loadAudio: loadAudio,
        play: play,
        pause: pause,
        stop: stop
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAudio = async (file: File) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioElementRef.current = new Audio();
    audioElementRef.current.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(file);
    audioElementRef.current.src = url;

    return new Promise<void>((resolve) => {
      if (!audioElementRef.current) return;
      
      audioElementRef.current.addEventListener('loadeddata', () => {
        console.log('✅ Simple visualizer: Audio loaded');
        setupAudioGraph();
        resolve();
      }, { once: true });
    });
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
      
      console.log('✅ Simple visualizer: Audio graph connected');
    } catch (error) {
      console.error('❌ Simple visualizer: Failed to setup audio graph:', error);
    }
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

    // Calculate bars
    const barCount = 64;
    const usableWidth = canvas.width * 0.9;
    const barWidth = usableWidth / barCount;
    const maxBarHeight = canvas.height * 0.8;

    // Check if we have any frequency data
    const maxFreq = Math.max(...frequencyData);

    if (maxFreq > 0) {
      console.log(`🎵 Simple visualizer: Drawing bars, max freq: ${maxFreq}`);
      
      // Draw bars
      ctx.fillStyle = '#00ff00'; // Green like WMP
      for (let i = 0; i < barCount; i++) {
        const freq = frequencyData[Math.floor(i * frequencyData.length / barCount)];
        const barHeight = (freq / 255) * maxBarHeight;
        
        const x = (canvas.width - usableWidth) / 2 + i * barWidth;
        const y = canvas.height - barHeight;
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(renderBars);
  };

  const play = async () => {
    if (!audioElementRef.current || !audioContextRef.current) return;

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      await audioElementRef.current.play();
      console.log('▶️ Simple visualizer: Playing');
      
      if (!animationFrameRef.current) {
        renderBars();
      }
    } catch (error) {
      console.error('❌ Simple visualizer: Play error:', error);
    }
  };

  const pause = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      console.log('⏸️ Simple visualizer: Paused');
    }
  };

  const stop = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      console.log('⏹️ Simple visualizer: Stopped');
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Simple Visualizer (Working)</h2>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{ 
          border: '1px solid #ccc', 
          background: 'black',
          display: 'block',
          margin: '20px auto'
        }}
      />
      <div>
        <input type="file" accept="audio/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadAudio(file);
        }} />
        <br /><br />
        <button onClick={play}>Play</button>
        <button onClick={pause}>Pause</button>
        <button onClick={stop}>Stop</button>
      </div>
    </div>
  );
};

export default SimpleVisualizer;