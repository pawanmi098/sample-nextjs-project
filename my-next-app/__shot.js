const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:4123', { waitUntil: 'load', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => console.log('networkidle timed out, continuing'));
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        img.scrollIntoView();
        try { await img.decode(); } catch (e) {}
      }
    });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    console.log(vp.name, overflow);
    await page.screenshot({ path: `${process.env.SCRATCH}/screenshot-${vp.name}.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
})();
