/**
 * Visualization Manager
 * Handles WMP-authentic color mapping, bar calculations, and visual effects
 * Separated from rendering for better architecture and maintainability
 */

import { FrequencyData, WaveformData } from './audio-engine';

export interface VisualizationConfig {
  barCount: number;
  colorScheme: 'wmp' | 'modern';
  peakHold: boolean;
  peakDecay: number;
  smoothing: number;
  amplification: number;
}

export interface BarVisualizationData {
  heights: number[];
  peaks: number[];
  colors: [number, number, number][];
}

export interface CircularVisualizationData {
  points: Array<{
    x: number;
    y: number;
    amplitude: number;
    color: [number, number, number];
  }>;
  rotation: number;
  centerGlow: {
    intensity: number;
    color: [number, number, number];
  };
}

export class WMPVisualizationManager {
  private config: VisualizationConfig;
  private peakValues: number[] = [];
  private peakHoldFrames: number[] = [];
  private smoothedValues: number[] = [];
  private rotation = 0;
  
  // WMP Constants
  private readonly PEAK_HOLD_FRAMES = 30;
  private readonly MIN_FREQUENCY = 20; // Hz
  private readonly MAX_FREQUENCY = 20000; // Hz
  
  constructor(config: VisualizationConfig) {
    this.config = config;
    this.initializeArrays();
  }
  
  private initializeArrays(): void {
    const size = this.config.barCount;
    this.peakValues = new Array(size).fill(0);
    this.peakHoldFrames = new Array(size).fill(0);
    this.smoothedValues = new Array(size).fill(0);
  }
  
  /**
   * Generate bar visualization data from frequency data
   */
  generateBarsVisualization(
    frequencyData: FrequencyData | null
  ): BarVisualizationData {
    if (!frequencyData) {
      return this.generateSilentBars();
    }
    
    const heights = this.calculateBarHeights(frequencyData.logarithmic);
    const peaks = this.calculatePeaks(heights);
    const colors = this.calculateBarColors(heights, peaks);
    
    return { heights, peaks, colors };
  }
  
  /**
   * Generate circular visualization data from waveform data
   */
  generateCircularVisualization(
    waveformData: WaveformData | null,
    width: number,
    height: number
  ): CircularVisualizationData {
    if (!waveformData) {
      return this.generateSilentCircular(width, height);
    }
    
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.3;
    
    // Calculate average amplitude for overall effects
    const avgAmplitude = this.calculateAverageAmplitude(waveformData.normalized);
    
    // Update rotation
    this.rotation += 0.01 + (avgAmplitude * 0.05);
    
    // Generate points around the circle
    const pointCount = 256;
    const angleStep = (Math.PI * 2) / pointCount;
    const points: CircularVisualizationData['points'] = [];
    
    for (let i = 0; i < pointCount; i++) {
      const waveIndex = Math.floor((i / pointCount) * waveformData.normalized.length);
      const amplitude = Math.abs(waveformData.normalized[waveIndex] || 0);
      
      // Apply smoothing
      const smoothedAmp = this.smoothValue(amplitude, i % this.smoothedValues.length);
      
      // Calculate radius based on amplitude
      const radiusMultiplier = 1 + (smoothedAmp * this.config.amplification);
      const radius = baseRadius * radiusMultiplier;
      
      // Calculate position with rotation
      const angle = (i * angleStep) + this.rotation;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Calculate color based on amplitude
      const color = this.calculateWaveColor(smoothedAmp);
      
      points.push({ x, y, amplitude: smoothedAmp, color });
    }
    
    // Calculate center glow
    const centerGlow = {
      intensity: Math.min(avgAmplitude * 2, 1),
      color: this.calculateCenterGlowColor(avgAmplitude),
    };
    
    return { points, rotation: this.rotation, centerGlow };
  }
  
  /**
   * Calculate bar heights from logarithmic frequency data
   */
  private calculateBarHeights(logarithmicData: number[]): number[] {
    const heights: number[] = [];
    
    for (let i = 0; i < this.config.barCount; i++) {
      const value = logarithmicData[i] || 0;
      
      // Apply amplification and smoothing
      let height = value * this.config.amplification;
      
      // Smooth the value
      height = this.smoothValue(height, i);
      
      // Clamp to [0, 1] range
      height = Math.max(0, Math.min(1, height));
      
      heights.push(height);
    }
    
    return heights;
  }
  
  /**
   * Calculate peak values with hold and decay
   */
  private calculatePeaks(heights: number[]): number[] {
    const peaks: number[] = [];
    
    for (let i = 0; i < heights.length; i++) {
      const currentHeight = heights[i];
      
      if (currentHeight > this.peakValues[i]) {
        // New peak
        this.peakValues[i] = currentHeight;
        this.peakHoldFrames[i] = this.PEAK_HOLD_FRAMES;
      } else if (this.peakHoldFrames[i] > 0) {
        // Hold peak
        this.peakHoldFrames[i]--;
      } else {
        // Decay peak
        this.peakValues[i] *= this.config.peakDecay;
      }
      
      peaks.push(this.config.peakHold ? this.peakValues[i] : 0);
    }
    
    return peaks;
  }
  
  /**
   * Calculate bar colors using WMP color scheme
   */
  private calculateBarColors(heights: number[], peaks: number[]): [number, number, number][] {
    const colors: [number, number, number][] = [];
    
    for (let i = 0; i < heights.length; i++) {
      const height = heights[i];
      const peak = peaks[i];
      
      // Use the higher value for color calculation
      const colorValue = Math.max(height, peak);
      
      let color: [number, number, number];
      
      if (this.config.colorScheme === 'wmp') {
        color = this.calculateWMPColor(colorValue);
      } else {
        color = this.calculateModernColor(colorValue);
      }
      
      colors.push(color);
    }
    
    return colors;
  }
  
  /**
   * Calculate WMP-authentic color (Green → Yellow → Red)
   */
  private calculateWMPColor(intensity: number): [number, number, number] {
    // WMP uses HSV color space: Hue from 120° (green) to 0° (red)
    const hue = 120 - (intensity * 120); // 120° to 0°
    const saturation = 1.0;
    const value = Math.max(0.3, intensity); // Minimum brightness
    
    return this.hsvToRgb(hue, saturation, value);
  }
  
  /**
   * Calculate modern color scheme
   */
  private calculateModernColor(intensity: number): [number, number, number] {
    // Blue to cyan to white gradient
    if (intensity < 0.5) {
      // Blue to cyan
      const t = intensity * 2;
      return [0, t, 1];
    } else {
      // Cyan to white
      const t = (intensity - 0.5) * 2;
      return [t, 1, 1];
    }
  }
  
  /**
   * Calculate wave color for circular visualization
   */
  private calculateWaveColor(amplitude: number): [number, number, number] {
    if (this.config.colorScheme === 'wmp') {
      return this.calculateWMPColor(amplitude);
    } else {
      return this.calculateModernColor(amplitude);
    }
  }
  
  /**
   * Calculate center glow color
   */
  private calculateCenterGlowColor(intensity: number): [number, number, number] {
    const hue = 120 - (intensity * 240); // Green to red through yellow
    return this.hsvToRgb(hue, 1.0, 1.0);
  }
  
  /**
   * Apply smoothing to a value
   */
  private smoothValue(newValue: number, index: number): number {
    if (index >= this.smoothedValues.length) return newValue;
    
    const oldValue = this.smoothedValues[index];
    const smoothed = oldValue + (newValue - oldValue) * this.config.smoothing;
    this.smoothedValues[index] = smoothed;
    
    return smoothed;
  }
  
  /**
   * Calculate average amplitude from waveform data
   */
  private calculateAverageAmplitude(waveform: number[]): number {
    let total = 0;
    for (const value of waveform) {
      total += Math.abs(value);
    }
    return total / waveform.length;
  }
  
  /**
   * Generate silent bars (when no audio)
   */
  private generateSilentBars(): BarVisualizationData {
    const heights = new Array(this.config.barCount).fill(0);
    const peaks = new Array(this.config.barCount).fill(0);
    const colors: [number, number, number][] = new Array(this.config.barCount)
      .fill(null)
      .map(() => [0.2, 0.2, 0.2]); // Dark gray
    
    return { heights, peaks, colors };
  }
  
  /**
   * Generate silent circular visualization
   */
  private generateSilentCircular(width: number, height: number): CircularVisualizationData {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.3;
    
    const pointCount = 256;
    const angleStep = (Math.PI * 2) / pointCount;
    const points: CircularVisualizationData['points'] = [];
    
    for (let i = 0; i < pointCount; i++) {
      const angle = i * angleStep;
      const x = centerX + Math.cos(angle) * baseRadius;
      const y = centerY + Math.sin(angle) * baseRadius;
      
      points.push({
        x,
        y,
        amplitude: 0,
        color: [0.3, 0.3, 0.3], // Dark gray
      });
    }
    
    return {
      points,
      rotation: 0,
      centerGlow: { intensity: 0, color: [0, 0, 0] },
    };
  }
  
  /**
   * Convert HSV to RGB
   */
  private hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    h = h / 60;
    const c = v * s;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;
    
    let r: number, g: number, b: number;
    
    if (h >= 0 && h < 1) {
      r = c; g = x; b = 0;
    } else if (h >= 1 && h < 2) {
      r = x; g = c; b = 0;
    } else if (h >= 2 && h < 3) {
      r = 0; g = c; b = x;
    } else if (h >= 3 && h < 4) {
      r = 0; g = x; b = c;
    } else if (h >= 4 && h < 5) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    return [r + m, g + m, b + m];
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize arrays if bar count changed
    if (newConfig.barCount && newConfig.barCount !== this.peakValues.length) {
      this.initializeArrays();
    }
  }
  
  /**
   * Reset all state
   */
  reset(): void {
    this.peakValues.fill(0);
    this.peakHoldFrames.fill(0);
    this.smoothedValues.fill(0);
    this.rotation = 0;
  }
}