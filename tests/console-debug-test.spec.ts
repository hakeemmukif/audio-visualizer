import { test, expect } from '@playwright/test';

test('console debug for circular wave switching', async ({ page }) => {
  const consoleLogs: string[] = [];
  
  // Capture console logs
  page.on('console', (msg) => {
    consoleLogs.push(msg.text());
    console.log(`CONSOLE: ${msg.text()}`);
  });
  
  console.log('🔍 Starting console debug test...');
  
  // Navigate to app
  await page.goto('/');
  await page.waitForSelector('canvas');
  
  // Initial state - should be in bars mode
  await page.waitForTimeout(1000);
  console.log('📊 Initial state loaded');
  
  // Switch to circular - this should trigger the useEffect
  console.log('🔄 Switching to Circular Wave mode...');
  const circularButton = page.locator('button', { hasText: 'Circular Wave' });
  await circularButton.click();
  
  // Wait for React state update and useEffect to run
  await page.waitForTimeout(2000);
  
  // Check if we see the expected logs
  const hasVisualizerTypeLog = consoleLogs.some(log => log.includes('visualizerType changed to: circular'));
  const hasStaticRenderLog = consoleLogs.some(log => log.includes('Rendering static visualization'));
  
  console.log(`✅ Found visualizerType change log: ${hasVisualizerTypeLog}`);
  console.log(`✅ Found static render log: ${hasStaticRenderLog}`);
  
  // Switch back to bars
  console.log('🔄 Switching back to Frequency Bars...');
  const barsButton = page.locator('button', { hasText: 'Frequency Bars' });
  await barsButton.click();
  await page.waitForTimeout(1000);
  
  const hasBarsLog = consoleLogs.some(log => log.includes('visualizerType changed to: bars'));
  console.log(`✅ Found bars change log: ${hasBarsLog}`);
  
  // Print all captured logs for analysis
  console.log('\n📋 All captured console logs:');
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}: ${log}`);
  });
  
  // Basic assertions
  expect(hasVisualizerTypeLog).toBe(true);
  expect(hasStaticRenderLog).toBe(true);
  
  console.log('✅ Console debug test completed successfully');
});