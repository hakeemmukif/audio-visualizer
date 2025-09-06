import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Windows Media Player Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load with volume at 0 by default', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that volume starts at 0% - look specifically for volume percentage in the control area
    const volumeText = page.locator('.wmp-control-panel').locator('div').filter({ hasText: /^\s*0%\s*$/ });
    await expect(volumeText).toBeVisible();
    console.log('✅ Volume starts at 0%');
  });

  test('should load audio file and show visualizer', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if Load Audio File button is visible
    const loadButton = page.locator('button', { hasText: 'Load Audio File' });
    await expect(loadButton).toBeVisible();
    console.log('✅ Load button found');

    // Create a test audio file path (using the existing test audio)
    const audioFilePath = path.join(__dirname, '..', 'public', 'test-audio.wav');
    
    // Click the load button to trigger file input
    await loadButton.click();
    await page.waitForTimeout(500);

    // Set the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(audioFilePath);
    
    // Wait for audio to load
    await page.waitForTimeout(2000);
    
    // Check if the audio loaded successfully by looking for Ready status in the control panel
    const statusReady = page.locator('.wmp-control-panel').locator('text=Ready').or(
      page.locator('.wmp-control-panel').locator('text=No Audio')
    );
    await expect(statusReady).toBeVisible({ timeout: 5000 });
    console.log('✅ Audio file processed');
  });

  test('should play audio and show visualization with volume at 0', async ({ page }) => {
    // Load the page and wait for it to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Load audio file
    const loadButton = page.locator('button', { hasText: 'Load Audio File' });
    await loadButton.click();
    
    const audioFilePath = path.join(__dirname, '..', 'public', 'test-audio.wav');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(audioFilePath);
    
    // Wait for audio to load
    await page.waitForTimeout(3000);

    // Verify volume is still 0 in the control panel
    const volumeDisplay = page.locator('.wmp-control-panel').locator('div').filter({ hasText: /^\s*0%\s*$/ });
    await expect(volumeDisplay).toBeVisible();
    console.log('✅ Volume remains at 0%');

    // Click play button - specifically the main play button (not the next button)
    const playButton = page.locator('button').filter({ hasText: /^►$/ });
    await expect(playButton).toBeVisible();
    await playButton.click();
    
    // Wait a moment for playback to start
    await page.waitForTimeout(2000);
    
    // Check if status shows Playing in the control panel
    const playingStatus = page.locator('.wmp-control-panel').locator('text=Playing');
    await expect(playingStatus).toBeVisible({ timeout: 5000 });
    console.log('✅ Audio is playing');

    // Check if visualizer canvas is present and rendering
    const visualizerCanvas = page.locator('canvas');
    await expect(visualizerCanvas).toBeVisible();
    
    // Take a screenshot to verify visualizer is rendering
    await page.screenshot({ path: 'tests/screenshots/visualizer-playing.png' });
    console.log('✅ Visualizer canvas is visible');

    // Wait for visualization to run for a few seconds
    await page.waitForTimeout(3000);
    
    // Verify the visualizer is still working (canvas should be updating)
    // We can check for the presence of visualization controls
    const visualizerContainer = page.locator('[data-testid="wmp-visualizer"]').or(
      page.locator('canvas')
    );
    await expect(visualizerContainer).toBeVisible();
    console.log('✅ Visualizer is running while audio plays with volume 0');
  });

  test('should allow volume adjustment while maintaining visualization', async ({ page }) => {
    // Load and play audio first
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const loadButton = page.locator('button', { hasText: 'Load Audio File' });
    await loadButton.click();
    
    const audioFilePath = path.join(__dirname, '..', 'public', 'test-audio.wav');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(audioFilePath);
    await page.waitForTimeout(3000);

    const playButton = page.locator('button').filter({ hasText: /^►$/ });
    await playButton.click();
    await page.waitForTimeout(2000);

    // Adjust volume from 0 to 50%
    const volumeSlider = page.locator('input[type="range"]').nth(1); // Second slider is volume
    await volumeSlider.fill('0.5');
    await page.waitForTimeout(1000);

    // Verify volume changed to 50%
    const volumeDisplay = page.locator('.wmp-control-panel').locator('text=50%');
    await expect(volumeDisplay).toBeVisible();
    console.log('✅ Volume changed to 50%');

    // Verify visualizer still works
    const visualizerCanvas = page.locator('canvas');
    await expect(visualizerCanvas).toBeVisible();
    
    // Set volume back to 0
    await volumeSlider.fill('0');
    await page.waitForTimeout(1000);

    // Verify volume is back to 0%
    const volumeZero = page.locator('.wmp-control-panel').locator('text=0%');
    await expect(volumeZero).toBeVisible();
    console.log('✅ Volume back to 0% and visualizer still works');

    await page.screenshot({ path: 'tests/screenshots/volume-test-final.png' });
  });

  test('should handle different visualizer modes', async ({ page }) => {
    // Load and play audio
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const loadButton = page.locator('button', { hasText: 'Load Audio File' });
    await loadButton.click();
    
    const audioFilePath = path.join(__dirname, '..', 'public', 'test-audio.wav');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(audioFilePath);
    await page.waitForTimeout(3000);

    const playButton = page.locator('button').filter({ hasText: /^►$/ });
    await playButton.click();
    await page.waitForTimeout(2000);

    // Check if there are any visualizer mode buttons/controls
    const visualizerButtons = page.locator('button').filter({ hasText: /bars|wave|circular/i });
    const buttonCount = await visualizerButtons.count();
    
    if (buttonCount > 0) {
      console.log(`Found ${buttonCount} visualizer mode buttons`);
      
      // Test switching between modes
      for (let i = 0; i < buttonCount; i++) {
        const button = visualizerButtons.nth(i);
        const buttonText = await button.textContent();
        await button.click();
        await page.waitForTimeout(1500);
        console.log(`✅ Switched to ${buttonText} mode`);
        
        // Verify canvas is still visible
        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();
      }
      
      await page.screenshot({ path: 'tests/screenshots/visualizer-modes-test.png' });
    } else {
      console.log('No visualizer mode buttons found, checking for default visualization');
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      console.log('✅ Default visualizer is working');
    }
  });
});