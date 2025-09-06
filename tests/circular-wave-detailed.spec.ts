import { test, expect } from '@playwright/test';

test('detailed circular wave visualization test', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  await page.waitForSelector('canvas');

  console.log('🔄 Testing circular wave mode...');
  
  // Switch to circular mode first
  const circularButton = page.locator('button', { hasText: 'Circular Wave' });
  await circularButton.click();
  await page.waitForTimeout(500);
  
  // Verify button is selected
  await expect(circularButton).toHaveClass(/bg-blue-600/);
  console.log('✅ Circular Wave button properly selected');
  
  // Take screenshot in static circular mode
  await page.screenshot({ path: 'screenshots/detailed-circular-static.png' });
  
  // Load audio file
  console.log('📁 Loading audio...');
  const loadButton = page.locator('button', { hasText: 'Load Audio File' });
  const fileChooserPromise = page.waitForEvent('filechooser');
  await loadButton.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('/Users/hakeem/Projects/windows-media-player-visualizer/test-audio.mp3');
  
  // Wait for audio to load
  await page.waitForTimeout(3000);
  
  // Take screenshot after audio loads
  await page.screenshot({ path: 'screenshots/detailed-circular-loaded.png' });
  
  // Start playback
  console.log('▶️ Starting playback...');
  const playButton = page.locator('button').filter({ hasText: '►' });
  await playButton.click();
  
  // Allow playback to start and stabilize
  await page.waitForTimeout(2000);
  
  // Take screenshot during active playback
  await page.screenshot({ path: 'screenshots/detailed-circular-playing-1.png' });
  
  // Wait a bit more to capture animation
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/detailed-circular-playing-2.png' });
  
  // Check if we can see any visual difference from the static state
  console.log('📊 Checking for visual activity...');
  
  // Get play status
  const isPlayingStatus = await page.locator('text=Playing').isVisible();
  console.log(`🎵 Playing status: ${isPlayingStatus}`);
  
  // Switch to bars to compare
  console.log('🔄 Switching to bars for comparison...');
  const barsButton = page.locator('button', { hasText: 'Frequency Bars' });
  await barsButton.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/detailed-bars-playing.png' });
  
  // Switch back to circular
  console.log('🔄 Back to circular...');
  await circularButton.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/detailed-circular-final.png' });
  
  console.log('✅ Detailed test completed');
});