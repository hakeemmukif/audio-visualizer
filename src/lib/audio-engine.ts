/**
 * Windows Media Player Audio Engine
 * Handles all audio processing, analysis, and Web Audio API integration
 * Separated from UI components for better architecture
 */

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  fileName: string | null;
}

export interface FrequencyData {
  raw: Uint8Array;
  logarithmic: number[];
  peaks: number[];
}

export interface WaveformData {
  raw: Uint8Array;
  normalized: number[];
}

export class WMPAudioEngine {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  
  private frequencyData: Uint8Array | null = null;
  private waveformData: Uint8Array | null = null;
  private peaks: number[] = [];
  
  private isInitialized = false;
  private stateListeners: Set<(state: AudioState) => void> = new Set();
  
  // WMP-specific constants
  private readonly FFT_SIZE = 2048;
  private readonly SMOOTHING_FACTOR = 0.8;
  private readonly FREQUENCY_BANDS = 64;
  private readonly PEAK_DECAY_RATE = 0.95;
  private readonly PEAK_HOLD_FRAMES = 30;
  
  constructor() {
    this.initializePeaks();
  }
  
  private initializePeaks(): void {
    this.peaks = new Array(this.FREQUENCY_BANDS).fill(0);
  }
  
  /**
   * Initialize the audio engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Initialize data arrays
      this.frequencyData = new Uint8Array(this.FFT_SIZE / 2);
      this.waveformData = new Uint8Array(this.FFT_SIZE);
      
      this.isInitialized = true;
      console.log('🎵 WMP Audio Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio engine:', error);
      throw error;
    }
  }
  
  
  /**
   * Load an audio file
   */
  async loadAudio(file: File): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Clean up previous audio
    this.cleanup();
    
    try {
      // Create new audio element
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      
      // Create object URL for file
      const url = URL.createObjectURL(file);
      this.audioElement.src = url;
      
      // Wait for audio to load
      await new Promise<void>((resolve, reject) => {
        if (!this.audioElement) {
          reject(new Error('Audio element not available'));
          return;
        }
        
        this.audioElement.addEventListener('loadeddata', () => {
          this.setupAudioGraph();
          this.notifyStateChange();
          resolve();
        }, { once: true });
        
        this.audioElement.addEventListener('error', (e) => {
          reject(new Error(`Failed to load audio: ${e}`));
        }, { once: true });
      });
      
      console.log(`✅ Audio loaded: ${file.name}`);
    } catch (error) {
      console.error('❌ Failed to load audio:', error);
      throw error;
    }
  }
  
  /**
   * Set up the Web Audio API graph
   */
  private setupAudioGraph(): void {
    if (!this.audioContext || !this.audioElement) return;
    
    try {
      // Create source node
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      
      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = this.SMOOTHING_FACTOR;
      
      // Create gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.0;
      
      // Connect the graph: source → analyser → gain → destination
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      console.log('🔗 Audio graph connected');
    } catch (error) {
      console.error('❌ Failed to setup audio graph:', error);
    }
  }
  
  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.audioElement || !this.audioContext) return;
    
    try {
      // Resume AudioContext if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      await this.audioElement.play();
      this.notifyStateChange();
      console.log('▶️ Playing');
    } catch (error) {
      console.error('❌ Play error:', error);
      throw error;
    }
  }
  
  /**
   * Pause audio
   */
  pause(): void {
    if (!this.audioElement) return;
    
    this.audioElement.pause();
    this.notifyStateChange();
    console.log('⏸️ Paused');
  }
  
  /**
   * Stop audio
   */
  stop(): void {
    if (!this.audioElement) return;
    
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.notifyStateChange();
    console.log('⏹️ Stopped');
  }
  
  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (this.gainNode) {
      this.gainNode.gain.value = clampedVolume;
    }
    
    if (this.audioElement) {
      this.audioElement.volume = clampedVolume;
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (!this.audioElement) return;
    
    const clampedTime = Math.max(0, Math.min(this.getDuration(), time));
    this.audioElement.currentTime = clampedTime;
    this.notifyStateChange();
  }
  
  /**
   * Get current audio state
   */
  getState(): AudioState {
    return {
      isPlaying: this.isPlaying(),
      isPaused: this.isPaused(),
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.getVolume(),
      isLoading: false, // TODO: Implement loading state
      fileName: null, // TODO: Store filename
    };
  }
  
  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): FrequencyData | null {
    if (!this.analyserNode || !this.frequencyData) return null;
    
    // Get raw frequency data
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    
    // Convert to logarithmic scale (64 bands)
    const logarithmic = this.convertToLogarithmic(this.frequencyData);
    
    // Update peaks with decay
    this.updatePeaks(logarithmic);
    
    return {
      raw: this.frequencyData,
      logarithmic,
      peaks: [...this.peaks],
    };
  }
  
  /**
   * Get waveform data for visualization
   */
  getWaveformData(): WaveformData | null {
    if (!this.analyserNode || !this.waveformData) return null;
    
    // Get raw waveform data
    this.analyserNode.getByteTimeDomainData(this.waveformData);
    
    // Normalize to -1 to 1 range
    const normalized = Array.from(this.waveformData).map(value => (value - 128) / 128);
    
    return {
      raw: this.waveformData,
      normalized,
    };
  }
  
  /**
   * Convert frequency data to logarithmic scale (WMP-style)
   */
  private convertToLogarithmic(frequencyData: Uint8Array): number[] {
    const logarithmic: number[] = [];
    const binCount = frequencyData.length;
    
    for (let i = 0; i < this.FREQUENCY_BANDS; i++) {
      // Logarithmic frequency mapping
      const logIndex = Math.floor((Math.pow(binCount, i / this.FREQUENCY_BANDS) - 1) / (binCount - 1) * binCount);
      const value = frequencyData[Math.min(logIndex, binCount - 1)] / 255;
      logarithmic.push(value);
    }
    
    return logarithmic;
  }
  
  /**
   * Update peak values with decay
   */
  private updatePeaks(logarithmic: number[]): void {
    for (let i = 0; i < logarithmic.length && i < this.peaks.length; i++) {
      // Update peak if current value is higher, otherwise decay
      this.peaks[i] = Math.max(logarithmic[i], this.peaks[i] * this.PEAK_DECAY_RATE);
    }
  }
  
  /**
   * Add listener for state changes
   */
  addStateListener(listener: (state: AudioState) => void): void {
    this.stateListeners.add(listener);
  }
  
  /**
   * Remove state listener
   */
  removeStateListener(listener: (state: AudioState) => void): void {
    this.stateListeners.delete(listener);
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateListeners.forEach(listener => listener(state));
  }
  
  // Helper methods
  private isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused && this.audioElement.currentTime > 0 : false;
  }
  
  private isPaused(): boolean {
    return this.audioElement ? this.audioElement.paused && this.audioElement.currentTime > 0 : false;
  }
  
  private getCurrentTime(): number {
    return this.audioElement?.currentTime ?? 0;
  }
  
  private getDuration(): number {
    return this.audioElement?.duration ?? 0;
  }
  
  private getVolume(): number {
    return this.gainNode?.gain.value ?? (this.audioElement?.volume ?? 0);
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      if (this.audioElement.src) {
        URL.revokeObjectURL(this.audioElement.src);
      }
      this.audioElement = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    this.initializePeaks();
  }
  
  /**
   * Destroy the audio engine
   */
  destroy(): void {
    this.cleanup();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.stateListeners.clear();
    this.isInitialized = false;
    
    console.log('🗑️ Audio engine destroyed');
  }
}