# Claude Memory - Windows Media Player Visualizer

## Project Overview
Windows Media Player Pixel-Perfect Visualizer replication - reverse-engineering and recreating WMP visualizations using modern web technologies with 95%+ pixel-perfect accuracy.

## Development Standards
- Pixel-perfect accuracy target: 95%+ match with original WMP output
- Performance target: Consistent 60fps rendering
- Frame-by-frame visual regression testing required
- No emojis in code or documentation

## Confidence Requirements
- Always stop and ask for clarification if confidence level is below 95% before proceeding
- Never make assumptions about color mapping algorithms, audio processing, or visualization parameters
- Must be at least 95% confident before implementing any visualization component
- When uncertain about WMP-specific behavior, refer to extracted reference frames

## Project Structure
- `/src/` - Main application source code
  - `/app/` - Next.js application pages and layouts
  - `/components/` - React components (WMPVisualizer, PlayerControls)
  - `/lib/` - Core visualization libraries (audio-engine, renderers)
  - `/types/` - TypeScript type definitions
- `/reference-frames/` - Original WMP frame captures for comparison
- `/public/` - Static assets and icons

## Build Validation Commands
Before any commit, ALWAYS run:

### Development Commands
- `npm run build` - Build Next.js application
- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run validate` - Run lint and build validation
- `npm run typecheck` - TypeScript type checking

### Testing Requirements
- Visual regression testing with pixelmatch library
- Frame-by-frame comparison with reference WMP output
- Color accuracy validation (HSV→RGB conversion)
- Performance testing to maintain 60fps target
- Audio processing validation against WMP FFT output

## Technical Specifications
- **Canvas Size**: 640x480 (4:3 aspect ratio)
- **Color Space**: sRGB, 8-bit depth
- **Rendering**: WebGL 2.0 with Canvas 2D fallback
- **Audio Engine**: Web Audio API with AnalyserNode
- **FFT Size**: 1024-2048 window size
- **Supported Formats**: MP3, WAV, AAC, OGG

## Visualization Components
### Bars Visualization (30% of frames)
- 64-bar logarithmic frequency spectrum
- HSV color gradient (green → yellow → red)
- Peak hold and decay animation
- Exact color mapping validation required

### Ambience Visualization (40% of frames)
- 300-particle system with physics
- Audio-reactive movement and colors
- Bloom and glow post-processing
- Organic flow using Perlin noise

### Spiral Visualization (20% of frames)
- 6-arm spiral geometry
- 3D perspective projection
- Audio-reactive rotation and scaling
- Depth-based particle effects

## Development Priorities
### Critical Tasks
1. Pixel-perfect color matching (HSV→RGB conversion)
2. Image comparison tools setup (Sharp, pixelmatch)

### High Priority Tasks
1. Exact WMP audio analysis replication
2. Frequency spectrum bars implementation
3. Particle-based ambience effects
4. Automated comparison system

## Quality Assurance
- Frame tolerance: 0.005-0.02 depending on visualization complexity
- Color accuracy: Exact RGB values within 1 unit
- Performance: 95% frame rate consistency at 60fps
- Memory budget: 50MB maximum
- CPU budget: 15% maximum usage

## File Naming Conventions
- Reference frames: `frame_XXXXX.jpg` (5-digit numbering)
- Test outputs: `[visualization]_reference_frame_[number].png`
- Color tests: HSV values → RGB validation
- Audio tests: Waveform analysis with frequency validation

## Dependencies Management
- Core: Next.js, React, TypeScript
- Audio: Web Audio API (native)
- Visualization: Canvas 2D, WebGL
- Performance: stats.js for monitoring
- Styling: Tailwind CSS

## Implementation Notes
- Anti-aliasing disabled for pixel-perfect matching
- Floor rounding for precision consistency
- Black background (0,0,0,1) clear color
- Source-over blend mode only
- No floating-point precision in color calculations