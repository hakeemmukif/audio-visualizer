'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';

export const PlayerControls: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Poll for state updates from the visualizer
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
        const visualizer = (window as any).wmpVisualizer;
        setIsPlaying(visualizer.isPlaying());
        setCurrentTime(visualizer.getCurrentTime());
        setDuration(visualizer.getDuration());
        setVolume(visualizer.getVolume());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      try {
        setIsLoading(true);
        setFileName(file.name);
        
        if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
          await (window as any).wmpVisualizer.loadAudio(file);
          console.log('✅ File loaded successfully:', file.name);
        }
      } catch (error) {
        console.error('❌ Failed to load file:', error);
        alert('Failed to load audio file. Please try a different file.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please select a valid audio file');
    }
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSeekChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
      (window as any).wmpVisualizer.seek(time);
    }
  }, []);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
      (window as any).wmpVisualizer.setVolume(newVolume);
    }
  }, []);

  const handlePlay = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
        await (window as any).wmpVisualizer.play();
      }
    } catch (error) {
      console.error('❌ Play error:', error);
      alert('Failed to play audio. Please check your file.');
    }
  }, []);

  const handlePause = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
      (window as any).wmpVisualizer.pause();
    }
  }, []);

  const handleStop = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).wmpVisualizer) {
      (window as any).wmpVisualizer.stop();
    }
  }, []);

  const formatTime = useCallback((time: number): string => {
    if (!isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="wmp-panel">
      {/* WMP-style title bar */}
      <div className="wmp-panel flex items-center justify-between px-3 py-2 border-b border-gray-600">
        <span className="text-xs font-medium text-white">Transport Controls</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
        </div>
      </div>

      <div className="p-4">
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* File Load Button */}
        <div className="mb-4">
          <button
            onClick={openFileDialog}
            className="wmp-button px-4 py-2 text-sm font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Audio File'}
          </button>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-2 mb-3">
          {/* Transport Buttons */}
          <div className="flex items-center space-x-1 bg-gray-800 p-1.5 rounded border border-gray-600">
            {/* Previous Button */}
            <button
              className="wmp-button w-8 h-8 flex items-center justify-center text-xs"
            >
              ◄◄
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={isLoading || duration === 0}
              className="wmp-button w-10 h-8 flex items-center justify-center text-sm font-bold"
              style={{
                background: isPlaying 
                  ? 'linear-gradient(180deg, #4CAF50 0%, #2E7D32 50%, #1B5E20 100%)'
                  : 'var(--wmp-button-gradient)'
              }}
            >
              {isLoading ? '...' : (isPlaying ? '||' : '►')}
            </button>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              disabled={isLoading || duration === 0}
              className="wmp-button w-8 h-8 flex items-center justify-center text-xs"
              style={{
                background: isPlaying 
                  ? 'linear-gradient(180deg, #F44336 0%, #C62828 50%, #B71C1C 100%)'
                  : 'var(--wmp-button-gradient)'
              }}
            >
              ■
            </button>

            {/* Next Button */}
            <button
              className="wmp-button w-8 h-8 flex items-center justify-center text-xs"
            >
              ►►
            </button>
          </div>

          {/* Time Display */}
          <div className="bg-black border border-gray-600 px-3 py-1 rounded">
            <div className="text-xs font-mono text-green-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Seek Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-300">Position</label>
            <div className="text-xs text-gray-400">
              {duration ? `${Math.round((currentTime / duration) * 100)}%` : '0%'}
            </div>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeekChange}
              disabled={!duration}
              className="wmp-slider w-full"
            />
            {/* Progress fill */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 pointer-events-none"
              style={{
                width: `${(currentTime / (duration || 1)) * 100}%`,
                borderRadius: '0',
                border: '1px inset var(--wmp-border)',
                height: '20px'
              }}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-300 flex items-center">
              🔊 Volume
            </label>
            <div className="text-xs text-gray-400 font-mono">
              {Math.round(volume * 100)}%
            </div>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="wmp-slider w-full"
            />
            {/* Volume fill */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400 pointer-events-none"
              style={{
                width: `${volume * 100}%`,
                borderRadius: '0',
                border: '1px inset var(--wmp-border)',
                height: '20px'
              }}
            />
          </div>
          
          {/* Volume Level Indicators */}
          <div className="flex justify-between mt-1 px-1">
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-2 ${
                  i <= Math.floor(volume * 10)
                    ? 'bg-green-400'
                    : 'bg-gray-600'
                }`}
                style={{ borderRadius: '1px' }}
              ></div>
            ))}
          </div>
        </div>

        {/* Audio File Info Panel */}
        <div className="wmp-panel p-3 mt-4">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 opacity-80"></div>
            <div className="text-xs font-semibold text-white">Audio Information</div>
          </div>
          <div className="text-xs text-gray-300 space-y-1">
            {fileName && (
              <div className="flex justify-between">
                <span>File:</span>
                <span className="text-blue-400 truncate ml-2" title={fileName}>
                  {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`${
                isLoading ? 'text-yellow-400' :
                isPlaying ? 'text-green-400' : 
                duration > 0 ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {isLoading ? 'Loading...' :
                 isPlaying ? 'Playing' :
                 duration > 0 ? 'Ready' : 'No Audio'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="text-blue-400">{formatTime(duration)}</span>
            </div>
            <div className="flex justify-between">
              <span>Algorithm:</span>
              <span className="text-blue-400">WMP Bars</span>
            </div>
            <div className="flex justify-between">
              <span>Frequency Bands:</span>
              <span className="text-blue-400">64</span>
            </div>
            <div className="flex justify-between">
              <span>Color Mapping:</span>
              <span className="text-blue-400">HSV</span>
            </div>
            <div className="flex justify-between">
              <span>Peak Decay:</span>
              <span className="text-blue-400">0.95</span>
            </div>
            <div className="flex justify-between">
              <span>FFT Size:</span>
              <span className="text-blue-400">1024</span>
            </div>
            <div className="flex justify-between">
              <span>Smoothing:</span>
              <span className="text-blue-400">0.8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;