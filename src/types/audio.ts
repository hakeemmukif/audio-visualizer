export interface AudioEngine {
  analyser: AnalyserNode;
  audioContext: AudioContext;
  source: AudioBufferSourceNode | MediaElementAudioSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface FrequencyData {
  raw: Uint8Array;
  logarithmic: Float32Array;
  timeStamp: number;
}

export interface VisualizationParams {
  barCount: number;
  fftSize: number;
  smoothingFactor: number;
  peakDecay: number;
  colorMapping: 'HSV' | 'RGB';
  scalingFunction: 'linear' | 'logarithmic';
}

export interface BarsVisualizationState {
  peakHeights: Float32Array;
  peakDecayCounters: Int32Array;
  smoothedAmplitudes: Float32Array;
  barPositions: Float32Array;
  colorBuffer: Float32Array;
}

export interface WMPConstants {
  WMP_BAR_COUNT: 64;
  WMP_PEAK_HOLD_FRAMES: 30;
  WMP_PEAK_DECAY_RATE: 0.95;
  WMP_BAR_WIDTH_RATIO: 0.8;
  WMP_BAR_SPACING: 2;
  WMP_FFT_SIZE: 1024;
  WMP_SMOOTHING: 0.8;
}