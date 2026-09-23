const { chromium } = await import("playwright");
const browser = await chromium.launch();

const desc = async (page) => page.evaluate(() => {
  const a = document.activeElement;
  return a ? `${a.tagName.toLowerCase()}${a.className ? "." + String(a.className).split(" ")[0].split("__").pop() : ""}` : "none";
});

// 1. tab order + escape
let ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
let page = await ctx.newPage();
await page.goto("http://localhost:4127/", { waitUntil: "load" });
await page.waitForSelector("dialog[open]");
console.log("initial focus:", await desc(page));
for (let i = 0; i < 5; i++) { await page.keyboard.press("Tab"); console.log("  tab ->", await desc(page)); }
console.log("page behind inert:", await page.evaluate(() => { const b = document.querySelector("main button, main a"); b.focus(); return document.activeElement !== b; }));
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
console.log("escape closed:", await page.locator("dialog").count() === 0);
console.log("body scroll restored:", await page.evaluate(() => document.body.style.overflow === ""));
await page.reload({ waitUntil: "load" });
console.log("reopens after escape (not acknowledged):", await page.locator("dialog[open]").count() === 1);
await ctx.close();

// 2. continue + persistence
ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
page = await ctx.newPage();
await page.goto("http://localhost:4127/", { waitUntil: "load" });
await page.waitForSelector("dialog[open]");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(150);
console.log("continue without consent keeps it open:", await page.locator("dialog[open]").count() === 1);
console.log("  focus moved to checkbox:", await page.evaluate(() => document.activeElement?.type === "checkbox"));
await page.keyboard.press("Space");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(200);
console.log("continue with consent closes:", await page.locator("dialog").count() === 0);
console.log("stored:", await page.evaluate(() => localStorage.getItem("ivs.home.disclaimer-acknowledged")));
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(300);
console.log("stays closed on reload:", await page.locator("dialog").count() === 0);
await ctx.close();

// 3. backdrop click
ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
page = await ctx.newPage();
await page.goto("http://localhost:4127/", { waitUntil: "load" });
await page.waitForSelector("dialog[open]");
await page.mouse.click(80, 700);
await page.waitForTimeout(200);
console.log("backdrop click closes:", await page.locator("dialog").count() === 0);
await ctx.close();

await browser.close();
