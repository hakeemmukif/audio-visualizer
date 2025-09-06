import Stats from 'stats.js';

export interface WebGLRenderer {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  program: WebGLProgram;
  vertexBuffer: WebGLBuffer;
  uniformLocations: Record<string, WebGLUniformLocation>;
  attributeLocations: Record<string, number>;
}

export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export interface RenderParams {
  width: number;
  height: number;
  barCount: number;
  amplitudes: Float32Array;
  peakHeights: Float32Array;
  colors: Float32Array;
  time: number;
}

export interface CanvasFallback {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  imageData: ImageData;
  width: number;
  height: number;
}

export interface PerformanceMonitor {
  fps: number;
  frameTime: number;
  drawCalls: number;
  vertices: number;
  stats: Stats | null; // stats.js instance
}