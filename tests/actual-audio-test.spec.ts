import { test, expect } from '@playwright/test';

test('actual audio playback with circular wave test', async ({ page }) => {
  console.log('🎵 Testing ACTUAL audio playback with circular wave...');
  
  // Navigate and wait for page
  await page.goto('/');
  await page.waitForSelector('canvas');
  
  // Switch to circular mode first
  console.log('🔄 Switching to Circular Wave mode...');
  const circularButton = page.locator('button', { hasText: 'Circular Wave' });
  await circularButton.click();
  await page.waitForTimeout(1000);
  
  // Verify UI shows circular mode
  await expect(circularButton).toHaveClass(/bg-blue-600/);
  const titleIndicator = page.locator('text=Circular Wave').first();
  await expect(titleIndicator).toBeVisible();
  
  // Take screenshot of static circular mode
  await page.screenshot({ path: 'screenshots/actual-test-static-circular.png' });
  console.log('📸 Static circular mode captured');
  
  // Load audio file
  console.log('📁 Loading audio file...');
  const loadButton = page.locator('button', { hasText: 'Load Audio File' });
  const fileChooserPromise = page.waitForEvent('filechooser');
  await loadButton.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('/Users/hakeem/Projects/windows-media-player-visualizer/test-audio.mp3');
  
  // Wait for audio to load properly
  await page.waitForTimeout(3000);
  console.log('✅ Audio file loaded');
  
  // Take screenshot after audio loads
  await page.screenshot({ path: 'screenshots/actual-test-audio-loaded.png' });
  
  // Now ACTUALLY start playback and wait
  console.log('▶️ ACTUALLY starting audio playback...');
  const playButton = page.locator('button').filter({ hasText: '►' });
  await playButton.click();
  
  // Wait longer for audio to actually start playing
  await page.waitForTimeout(5000);
  
  // Check if audio is actually playing
  const playingStatus = await page.locator('text=Playing').isVisible();
  console.log(`🎵 Audio playing status: ${playingStatus}`);
  
  // Take screenshot during ACTUAL playback
  await page.screenshot({ path: 'screenshots/actual-test-PLAYING-circular.png' });
  console.log('📸 During playback screenshot taken');
  
  // Wait more to see animation
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/actual-test-PLAYING-circular-2.png' });
  
  // Switch to bars mode during playback to compare
  console.log('🔄 Switching to bars during playback...');
  const barsButton = page.locator('button', { hasText: 'Frequency Bars' });
  await barsButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/actual-test-PLAYING-bars.png' });
  
  // Switch BACK to circular during playback - this is the critical test
  console.log('🔄 Switching BACK to circular during playback - CRITICAL TEST!');
  await circularButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/actual-test-CRITICAL-circular-during-playback.png' });
  
  // Final verification
  const finalPlayingStatus = await page.locator('text=Playing').isVisible();
  console.log(`🎵 Final playing status: ${finalPlayingStatus}`);
  
  if (!finalPlayingStatus) {
    console.log('❌ AUDIO NOT ACTUALLY PLAYING - this explains the issue!');
  } else {
    console.log('✅ Audio is playing - let\'s see what visualization renders');
  }
  
  console.log('🏁 Comprehensive audio test completed');
});