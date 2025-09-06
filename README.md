# Windows Media Player Visualizer

A pixel-perfect recreation of the classic Windows Media Player Bars visualization built with Next.js, TypeScript, and WebGL.

## Features

- **Authentic Algorithm**: Exact reproduction of WMP's 64 logarithmic frequency bars
- **WebGL Performance**: Hardware-accelerated rendering targeting 60fps
- **Audio Processing**: Real-time Web Audio API integration with precise frequency analysis
- **Color Mapping**: HSV gradient from Green → Yellow → Red based on amplitude
- **Peak Hold Effect**: Classic peak indicators with authentic 0.95 decay rate
- **Canvas Fallback**: Full compatibility for systems without WebGL support
- **Modern UI**: Clean, responsive interface with comprehensive controls

## Technical Specifications

- **FFT Size**: 1024
- **Smoothing Factor**: 0.8 (matching WMP)
- **Frequency Bars**: 64 logarithmic scale
- **Peak Hold**: 30 frames duration
- **Color Space**: HSV with 120° range (Green to Red)
- **Rendering**: WebGL with Canvas 2D fallback

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

4. **Load Audio**
   - Click "Load Audio File"
   - Select any audio file (MP3, WAV, OGG, etc.)
   - Use play/pause controls to start visualization

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript validation
- `npm run validate` - Complete validation (lint + build)

## Browser Support

- Modern browsers with Web Audio API support
- WebGL 1.0 or 2.0 for hardware acceleration
- Automatic fallback to Canvas 2D if WebGL unavailable

## Architecture

### Core Components

- **WMPAudioEngine**: Web Audio API integration and frequency analysis
- **WMPBarsVisualizer**: Algorithm implementation matching original WMP
- **WMPWebGLRenderer**: High-performance WebGL rendering
- **WMPCanvasRenderer**: Canvas 2D compatibility layer
- **PlayerControls**: Audio playback and file management

### File Structure

```
src/
├── app/page.tsx              # Main application
├── components/
│   ├── WMPVisualizer.tsx     # Core visualizer component
│   └── PlayerControls.tsx    # Audio controls
├── lib/
│   ├── audio-engine.ts       # Web Audio API integration
│   ├── bars-visualizer.ts    # WMP algorithm implementation
│   ├── webgl-renderer.ts     # WebGL rendering engine
│   ├── canvas-renderer.ts    # Canvas 2D fallback
│   └── constants.ts          # WMP constants
└── types/
    ├── audio.ts              # Audio type definitions
    └── webgl.ts              # Rendering type definitions
```

## Performance

- **Target FPS**: 60fps with hardware acceleration
- **Audio Latency**: <20ms with Web Audio API
- **Memory Usage**: Optimized with proper cleanup
- **Real-time Monitoring**: Built-in FPS counter

## Development Notes

This implementation is based on reverse-engineering the original Windows Media Player visualization algorithms, ensuring pixel-perfect accuracy while leveraging modern web technologies for optimal performance.

The project follows strict TypeScript practices and includes comprehensive error handling, resource cleanup, and cross-browser compatibility.

## License

MIT License - Feel free to use and modify for your projects.
