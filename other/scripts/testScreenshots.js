import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  if (!fs.existsSync('frontend/public/screenshots')) {
    fs.mkdirSync('frontend/public/screenshots', { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Navigating to landing page...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'frontend/public/screenshots/1-landing-desktop.png' });

  console.log('2. Opening Pricing...');
  await page.click('nav button:has-text("Pricing")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'frontend/public/screenshots/2-pricing.png' });

  console.log('3. Navigating to Admin Overview...');
  // Click Workspace button to open dashboard
  await page.click('button:has-text("Workspace")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'frontend/public/screenshots/3-admin-sidebar.png' });

  console.log('4. Navigating to Faculty Console...');
  // Click on Faculty in the role switcher dropdown or in the sidebar
  await page.click('aside button:has-text("Overview")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'frontend/public/screenshots/4-faculty-live.png' });

  console.log('5. Navigating to Corrections Review...');
  await page.click('aside button:has-text("Corrections")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'frontend/public/screenshots/5-corrections.png' });

  console.log('6. Testing Search Palette (Ctrl+K)...');
  await page.click('button:has-text("Search...")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'frontend/public/screenshots/6-search-palette.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  console.log('7. Testing Dark Theme Toggle...');
  // Click theme toggle button in header
  await page.click('header button[title*="dark"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'frontend/public/screenshots/7-dark-mode.png' });

  console.log('8. Testing Mobile Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'frontend/public/screenshots/8-mobile-view.png' });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
