'use client';

import React, { useRef, useEffect, useState } from 'react';

interface CircularWaveVisualizerProps {
  width: number;
  height: number;
  analyserRef?: React.RefObject<AnalyserNode | null>; // For compatibility
  isPlaying?: boolean; // For compatibility
}

export const CircularWaveVisualizer: React.FC<CircularWaveVisualizerProps> = ({
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Poll for state from the main visualizer
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
        setIsPlaying((window as any).wmpVisualizer.isPlaying());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const renderCircularWave = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.4;

    if (isPlaying) {
      // Get analyser from the main visualizer if available
      let frequencyData: Uint8Array | null = null;
      
      if (typeof window !== 'undefined' && (window as any).wmpVisualizerAnalyser) {
        const analyser = (window as any).wmpVisualizerAnalyser;
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
      }

      if (frequencyData && Math.max(...frequencyData) > 0) {
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
    ctx.fillStyle = isPlaying ? '#00ff00' : 'rgba(0, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer reference ring
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    ctx.strokeStyle = isPlaying ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(renderCircularWave);
  };

  // Start render loop on mount
  useEffect(() => {
    if (!animationFrameRef.current) {
      renderCircularWave();
    }

    // Expose analyser to global scope for this component to use
    const checkAnalyser = () => {
      if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
        // Try to get the analyser from the main visualizer
        const visualizer = (window as any).wmpVisualizer;
        if (visualizer.getAnalyser) {
          (window as any).wmpVisualizerAnalyser = visualizer.getAnalyser();
        }
      }
    };
    
    const analyserInterval = setInterval(checkAnalyser, 1000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(analyserInterval);
    };
  }, []);

  return (
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
  );
};

export default CircularWaveVisualizer;