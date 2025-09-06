import { test, expect } from '@playwright/test';

test('circular wave mode functionality test', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="visualizer-canvas"], canvas');
  
  // Take initial screenshot in bars mode
  await page.screenshot({ path: 'screenshots/test-bars-mode-initial.png' });
  
  // Find and click the Circular Wave button
  const circularButton = page.locator('button', { hasText: 'Circular Wave' });
  await expect(circularButton).toBeVisible();
  
  console.log('🔘 Clicking Circular Wave button...');
  await circularButton.click();
  
  // Wait a moment for any state changes
  await page.waitForTimeout(1000);
  
  // Take screenshot after switching to circular mode
  await page.screenshot({ path: 'screenshots/test-circular-mode-after-click.png' });
  
  // Verify circular button was clicked (check if it contains any blue styling eventually)
  // For now, just wait a moment to let the state update
  await page.waitForTimeout(500);
  
  // Verify the visualizer type indicator in the panel shows "Circular Wave"
  const visualizerTypeIndicator = page.locator('text=Circular Wave').first();
  await expect(visualizerTypeIndicator).toBeVisible();
  
  // Load an audio file to test the actual visualization
  console.log('📁 Loading test audio file...');
  
  // Click the Load Audio File button
  const loadButton = page.locator('button', { hasText: 'Load Audio File' });
  
  // Set up file chooser to select the test audio
  const fileChooserPromise = page.waitForEvent('filechooser');
  await loadButton.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('/Users/hakeem/Projects/windows-media-player-visualizer/test-audio.mp3');
  
  // Wait for file to load
  await page.waitForTimeout(2000);
  
  // Take screenshot after loading audio in circular mode
  await page.screenshot({ path: 'screenshots/test-circular-mode-audio-loaded.png' });
  
  // Click play button
  console.log('▶️ Starting playback...');
  const playButton = page.locator('button', { hasText: '►' });
  await playButton.click();
  
  // Wait for playback to start and visualization to render
  await page.waitForTimeout(3000);
  
  // Take screenshot during playback with circular mode
  await page.screenshot({ path: 'screenshots/test-circular-mode-playing.png' });
  
  // Switch back to bars mode to compare
  console.log('🔄 Switching back to Frequency Bars...');
  const barsButton = page.locator('button', { hasText: 'Frequency Bars' });
  await barsButton.click();
  await page.waitForTimeout(1000);
  
  // Take screenshot in bars mode while playing
  await page.screenshot({ path: 'screenshots/test-bars-mode-playing.png' });
  
  // Switch back to circular to confirm the issue
  console.log('🔄 Switching back to Circular Wave...');
  await circularButton.click();
  await page.waitForTimeout(1000);
  
  // Take final screenshot
  await page.screenshot({ path: 'screenshots/test-circular-mode-final.png' });
  
  // Log the current state
  const isPlaying = await page.locator('text=Playing').isVisible();
  console.log(`🎵 Audio playing: ${isPlaying}`);
  
  // Check canvas content - this is where we'll see if circular mode actually renders differently
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  
  console.log('✅ Test completed. Check screenshots to verify if circular mode is working.');
});