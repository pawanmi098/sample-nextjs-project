// Screenshot of the search-result header with the trip search panel expanded.
const [url, width = "1280", out = "open.png", height = "700"] = process.argv.slice(2);
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.goto(url, { waitUntil: "load" });
await page.evaluate(async () => {
  await document.fonts.ready;
  for (const img of document.querySelectorAll("img")) { img.loading = "eager"; await img.decode().catch(() => {}); }
});
const toggle = page.getByRole("button", { name: /edit trip details/i });
await page.waitForTimeout(1500); // let the client island hydrate
await toggle.click();
await page.waitForSelector('[aria-expanded="true"]');
await page.waitForTimeout(400);
await page.evaluate(async () => {
  for (const img of document.querySelectorAll("img")) { img.loading = "eager"; await img.decode().catch(() => {}); }
});
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (overflow > 0) console.warn(`! horizontal overflow of ${overflow}px at ${width}px`);
await page.screenshot({ path: out });
await browser.close();
console.log(`saved ${out}`);
