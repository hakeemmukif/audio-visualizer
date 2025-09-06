'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import PlayerControls from '@/components/PlayerControls';

// Dynamically import the visualizer to avoid SSR issues
const WMPVisualizer = dynamic(() => import('@/components/WMPVisualizer'), {
  ssr: false,
  loading: () => <div className="w-[700px] h-[450px] bg-black border border-gray-300 flex items-center justify-center text-white">Loading visualizer...</div>
});

export default function Home() {
  const [visualizerType, setVisualizerType] = useState<'bars' | 'circular'>('bars');
  
  // Track which renderer is being used
  const useWebGL = false; // Use Canvas for now since WebGL was broken
  const rendererName = useWebGL ? 'WebGL' : 'Canvas 2D';

  return (
    <div className="min-h-screen" style={{ background: 'var(--wmp-background)' }}>
      {/* WMP-style application window */}
      <div className="max-w-6xl mx-auto p-4">
        {/* WMP Title Bar */}
        <div className="wmp-panel wmp-title-bar flex items-center justify-between px-4 py-2 mb-0">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded opacity-90"></div>
            <h1 className="text-sm font-medium text-white">
              Windows Media Player - Visualizations (Redesigned)
            </h1>
          </div>
          <div className="flex items-center space-x-2 window-controls">
            <button className="wmp-button w-6 h-6 text-xs flex items-center justify-center">—</button>
            <button className="wmp-button w-6 h-6 text-xs flex items-center justify-center">□</button>
            <button className="wmp-button w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600">×</button>
          </div>
        </div>

        {/* WMP Main Interface */}
        <div className="wmp-panel border-t-0 rounded-none">
          {/* Menu Bar */}
          <div className="wmp-menu-bar bg-gray-700 border-b border-gray-600 px-3 py-1">
            <div className="flex space-x-4 text-xs text-white">
              <span className="hover:bg-gray-600 px-2 py-1 cursor-pointer transition-colors">File</span>
              <span className="hover:bg-gray-600 px-2 py-1 cursor-pointer transition-colors">View</span>
              <span className="hover:bg-gray-600 px-2 py-1 cursor-pointer transition-colors">Play</span>
              <span className="bg-gray-600 px-2 py-1 cursor-pointer">Tools</span>
              <span className="hover:bg-gray-600 px-2 py-1 cursor-pointer transition-colors">Help</span>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex h-[700px] wmp-main-layout">
            {/* Visualization Area (70% width) */}
            <div className="flex-1 pr-2 p-4 wmp-visualization-area">
              <WMPVisualizer
                width={700}
                height={500}
                visualizerType={visualizerType}
                renderMode={useWebGL ? 'webgl' : 'canvas'}
              />
            </div>

            {/* Control Panel (30% width) */}
            <div className="w-80 border-l border-gray-600 pl-2 p-4 wmp-control-panel">
              {/* Visualizer Type Selection */}
              <div className="mb-4">
                <div className="wmp-panel p-3">
                  <h3 className="text-sm font-medium text-white mb-3">Visualizer Type</h3>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setVisualizerType('bars')}
                      className={`wmp-button px-3 py-2 text-sm transition-colors ${
                        visualizerType === 'bars' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      Frequency Bars
                    </button>
                    <button
                      onClick={() => setVisualizerType('circular')}
                      className={`wmp-button px-3 py-2 text-sm transition-colors ${
                        visualizerType === 'circular' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      Circular Wave
                    </button>
                  </div>
                </div>
              </div>

              <PlayerControls />
            </div>
          </div>
        </div>

        {/* WMP Status Bar */}
        <div className="wmp-status-bar flex items-center justify-between mt-0">
          <div className="flex items-center space-x-6 text-xs">
            <span>Ready</span>
            <span className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Audio Engine: Online</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span>Renderer: {rendererName}</span>
            <span>|</span>
            <span>Version: 12.0</span>
          </div>
        </div>

        {/* Quick Help Panel (Collapsible) */}
        <div className="mt-4">
          <details className="wmp-panel">
            <summary className="cursor-pointer p-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
              Quick Help & Features
            </summary>
            <div className="p-4 border-t border-gray-600 wmp-quick-help">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="text-white font-semibold mb-2">Getting Started</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Click &ldquo;Load Audio File&rdquo; to select music</li>
                    <li>• Use transport controls to play/pause</li>
                    <li>• Adjust volume and position as needed</li>
                    <li>• Watch the authentic WMP bars visualization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Technical Features</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Real-time frequency analysis</li>
                    <li>• Authentic WMP visualization algorithms</li>
                    <li>• Canvas 2D rendering for compatibility</li>
                    <li>• Responsive audio visualization</li>
                  </ul>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <div className="wmp-status-bar text-xs">
            Built with Next.js, TypeScript, and Canvas 2D | Recreating the nostalgia of Windows Media Player
          </div>
        </footer>
      </div>
    </div>
  );
}