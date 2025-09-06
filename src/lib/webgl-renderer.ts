/**
 * WebGL Renderer for Windows Media Player Visualizations
 * High-performance hardware-accelerated rendering for 60+ FPS
 * Implements authentic WMP visual algorithms with pixel-perfect accuracy
 */

export interface RenderConfig {
  width: number;
  height: number;
  backgroundColor: [number, number, number, number];
  barCount: number;
  colorScheme: 'wmp' | 'custom';
}

export interface BarData {
  heights: number[];
  peaks: number[];
  colors: [number, number, number][];
}

export class WMPWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  
  // Buffers
  private vertexBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  // Shader locations
  private positionLocation = -1;
  private colorLocation = -1;
  private resolutionLocation: WebGLUniformLocation | null = null;
  
  // Configuration
  private config: RenderConfig;
  
  // Vertex and color data
  private vertexData: Float32Array;
  private colorData: Float32Array;
  private indexData: Uint16Array;
  
  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas;
    this.config = config;
    
    // Initialize data arrays
    const vertexCount = config.barCount * 4; // 4 vertices per bar (quad)
    const indexCount = config.barCount * 6; // 6 indices per bar (2 triangles)
    
    this.vertexData = new Float32Array(vertexCount * 2); // x, y per vertex
    this.colorData = new Float32Array(vertexCount * 3); // r, g, b per vertex
    this.indexData = new Uint16Array(indexCount);
    
    this.initialize();
  }
  
  /**
   * Initialize WebGL context and shaders
   */
  private initialize(): void {
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl', {
      antialias: false, // Disable for pixel-perfect rendering
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    // Set up viewport
    this.gl.viewport(0, 0, this.config.width, this.config.height);
    
    // Create shader program
    this.createShaderProgram();
    
    // Create buffers
    this.createBuffers();
    
    // Set up rendering state
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Clear color (black background)
    const [r, g, b, a] = this.config.backgroundColor;
    this.gl.clearColor(r, g, b, a);
    
    console.log('🎨 WebGL renderer initialized');
  }
  
  /**
   * Create and compile shader program
   */
  private createShaderProgram(): void {
    if (!this.gl) return;
    
    // Vertex shader source
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      
      uniform vec2 u_resolution;
      
      varying vec3 v_color;
      
      void main() {
        // Convert from pixels to clip space
        vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_color = a_color;
      }
    `;
    
    // Fragment shader source
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec3 v_color;
      
      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `;
    
    // Create shaders
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }
    
    // Create program
    this.program = this.gl.createProgram();
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }
    
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(this.program);
      throw new Error(`Shader program link error: ${error}`);
    }
    
    // Get attribute and uniform locations
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.colorLocation = this.gl.getAttribLocation(this.program, 'a_color');
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    
    console.log('🔧 Shaders compiled and linked');
  }
  
  /**
   * Create and compile individual shader
   */
  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      console.error(`Shader compile error: ${error}`);
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  /**
   * Create WebGL buffers
   */
  private createBuffers(): void {
    if (!this.gl) return;
    
    // Vertex buffer
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexData, this.gl.DYNAMIC_DRAW);
    
    // Color buffer
    this.colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colorData, this.gl.DYNAMIC_DRAW);
    
    // Index buffer
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    // Generate indices for bars (2 triangles per bar)
    for (let i = 0; i < this.config.barCount; i++) {
      const offset = i * 6;
      const vertexOffset = i * 4;
      
      // Triangle 1: top-left, bottom-left, top-right
      this.indexData[offset] = vertexOffset;
      this.indexData[offset + 1] = vertexOffset + 1;
      this.indexData[offset + 2] = vertexOffset + 2;
      
      // Triangle 2: top-right, bottom-left, bottom-right
      this.indexData[offset + 3] = vertexOffset + 2;
      this.indexData[offset + 4] = vertexOffset + 1;
      this.indexData[offset + 5] = vertexOffset + 3;
    }
    
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexData, this.gl.STATIC_DRAW);
    
    console.log('📦 WebGL buffers created');
  }
  
  /**
   * Render bars visualization
   */
  renderBars(barData: BarData): void {
    if (!this.gl || !this.program) return;
    
    // Clear canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    this.gl.useProgram(this.program);
    
    // Set resolution uniform
    if (this.resolutionLocation) {
      this.gl.uniform2f(this.resolutionLocation, this.config.width, this.config.height);
    }
    
    // Update vertex and color data
    this.updateBarGeometry(barData);
    
    // Bind vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vertexData);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    // Bind color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.colorData);
    this.gl.enableVertexAttribArray(this.colorLocation);
    this.gl.vertexAttribPointer(this.colorLocation, 3, this.gl.FLOAT, false, 0, 0);
    
    // Bind index buffer and draw
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.indexData.length, this.gl.UNSIGNED_SHORT, 0);
  }
  
  /**
   * Update bar geometry based on frequency data
   */
  private updateBarGeometry(barData: BarData): void {
    const { heights, colors } = barData;
    const barWidth = (this.config.width * 0.9) / this.config.barCount;
    const maxBarHeight = this.config.height * 0.8;
    const startX = (this.config.width - (this.config.width * 0.9)) / 2;
    const baseY = this.config.height;
    
    for (let i = 0; i < this.config.barCount; i++) {
      const height = heights[i] * maxBarHeight;
      const [r, g, b] = colors[i];
      
      const x = startX + (i * barWidth);
      const y = baseY - height;
      
      // Vertex positions (quad: top-left, bottom-left, top-right, bottom-right)
      const vertexOffset = i * 8; // 4 vertices * 2 coordinates
      
      // Top-left
      this.vertexData[vertexOffset] = x;
      this.vertexData[vertexOffset + 1] = y;
      
      // Bottom-left
      this.vertexData[vertexOffset + 2] = x;
      this.vertexData[vertexOffset + 3] = baseY;
      
      // Top-right
      this.vertexData[vertexOffset + 4] = x + barWidth - 1;
      this.vertexData[vertexOffset + 5] = y;
      
      // Bottom-right
      this.vertexData[vertexOffset + 6] = x + barWidth - 1;
      this.vertexData[vertexOffset + 7] = baseY;
      
      // Colors (same for all 4 vertices of this bar)
      const colorOffset = i * 12; // 4 vertices * 3 components
      for (let j = 0; j < 4; j++) {
        const offset = colorOffset + (j * 3);
        this.colorData[offset] = r;
        this.colorData[offset + 1] = g;
        this.colorData[offset + 2] = b;
      }
    }
  }
  
  /**
   * Clear the canvas
   */
  clear(): void {
    if (!this.gl) return;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  
  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (!this.gl) return;
    
    // Delete buffers
    if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
    if (this.colorBuffer) this.gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) this.gl.deleteBuffer(this.indexBuffer);
    
    // Delete program
    if (this.program) this.gl.deleteProgram(this.program);
    
    console.log('🗑️ WebGL renderer destroyed');
  }
  
  /**
   * Check if WebGL is supported
   */
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl instanceof WebGLRenderingContext;
    } catch {
      return false;
    }
  }
}