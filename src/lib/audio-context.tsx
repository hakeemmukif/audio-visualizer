/**
 * Audio Context Provider
 * Centralized state management for audio engine and visualization
 * Eliminates component coupling and mixed responsibilities
 */

'use client';

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { WMPAudioEngine, AudioState, FrequencyData, WaveformData } from './audio-engine';

interface AudioContextValue {
  // Audio Engine
  audioEngine: WMPAudioEngine | null;
  
  // State
  audioState: AudioState;
  frequencyData: FrequencyData | null;
  waveformData: WaveformData | null;
  
  // Actions
  loadAudio: (file: File) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  
  // Visualization
  startVisualization: () => void;
  stopVisualization: () => void;
  isVisualizationActive: boolean;
}

const AudioContext = createContext<AudioContextValue | null>(null);

interface AudioProviderProps {
  children: React.ReactNode;
}

const initialAudioState: AudioState = {
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
  isLoading: false,
  fileName: null,
};

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioEngineRef = useRef<WMPAudioEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [audioState, setAudioState] = useState<AudioState>(initialAudioState);
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isVisualizationActive, setIsVisualizationActive] = useState(false);
  
  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new WMPAudioEngine();
    
    // Add state listener
    const handleStateChange = (state: AudioState) => {
      setAudioState(state);
    };
    
    audioEngineRef.current.addStateListener(handleStateChange);
    
    // Initialize engine
    audioEngineRef.current.initialize().catch(console.error);
    
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.removeStateListener(handleStateChange);
        audioEngineRef.current.destroy();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Visualization loop
  const updateVisualizationData = useCallback(() => {
    if (!audioEngineRef.current || !isVisualizationActive) return;
    
    const freqData = audioEngineRef.current.getFrequencyData();
    const waveData = audioEngineRef.current.getWaveformData();
    
    setFrequencyData(freqData);
    setWaveformData(waveData);
    
    animationFrameRef.current = requestAnimationFrame(updateVisualizationData);
  }, [isVisualizationActive]);
  
  // Start/stop visualization based on playing state
  useEffect(() => {
    if (audioState.isPlaying && !isVisualizationActive) {
      startVisualization();
    } else if (!audioState.isPlaying && isVisualizationActive) {
      stopVisualization();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioState.isPlaying, isVisualizationActive]);
  
  // Audio actions
  const loadAudio = useCallback(async (file: File) => {
    if (!audioEngineRef.current) throw new Error('Audio engine not initialized');
    
    setAudioState(prev => ({ ...prev, isLoading: true, fileName: file.name }));
    
    try {
      await audioEngineRef.current.loadAudio(file);
      setAudioState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAudioState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);
  
  const play = useCallback(async () => {
    if (!audioEngineRef.current) return;
    await audioEngineRef.current.play();
  }, []);
  
  const pause = useCallback(() => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.pause();
  }, []);
  
  const stop = useCallback(() => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.stop();
  }, []);
  
  const setVolume = useCallback((volume: number) => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.setVolume(volume);
  }, []);
  
  const seek = useCallback((time: number) => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.seek(time);
  }, []);
  
  // Visualization controls
  const startVisualization = useCallback(() => {
    if (isVisualizationActive) return;
    
    setIsVisualizationActive(true);
    updateVisualizationData();
    console.log('🎨 Visualization started');
  }, [isVisualizationActive, updateVisualizationData]);
  
  const stopVisualization = useCallback(() => {
    if (!isVisualizationActive) return;
    
    setIsVisualizationActive(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear visualization data
    setFrequencyData(null);
    setWaveformData(null);
    
    console.log('🎨 Visualization stopped');
  }, [isVisualizationActive]);
  
  const contextValue: AudioContextValue = {
    audioEngine: audioEngineRef.current,
    audioState,
    frequencyData,
    waveformData,
    loadAudio,
    play,
    pause,
    stop,
    setVolume,
    seek,
    startVisualization,
    stopVisualization,
    isVisualizationActive,
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextValue => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};