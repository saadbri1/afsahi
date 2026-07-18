import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function measure() {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    window.__perf = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__perf.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      window.__perf.lcp = list.getEntries().at(-1)?.startTime || 0;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:4173", { waitUntil: "load", timeout: 15000 });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = Object.fromEntries(performance.getEntriesByType("paint").map((entry) => [entry.name, entry.startTime]));
    const resources = performance.getEntriesByType("resource");
    return {
      domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
      loadMs: Math.round(navigation.loadEventEnd),
      firstContentfulPaintMs: Math.round(paints["first-contentful-paint"] || 0),
      largestContentfulPaintMs: Math.round(
        window.__perf.lcp
          || performance.getEntriesByType("largest-contentful-paint").at(-1)?.startTime
          || 0
      ),
      cumulativeLayoutShift: Number(window.__perf.cls.toFixed(4)),
      transferredKb: Math.round(resources.reduce((total, entry) => total + (entry.transferSize || 0), 0) / 1024),
      jsTransferredKb: Math.round(resources.filter((entry) => entry.name.endsWith(".js")).reduce((total, entry) => total + (entry.transferSize || 0), 0) / 1024),
      resourceCount: resources.length,
    };
  });
  await page.close();
  return result;
}

try {
  const samples = [];
  for (let run = 0; run < 3; run += 1) samples.push(await measure());
  const keys = Object.keys(samples[0]);
  const median = Object.fromEntries(keys.map((key) => {
    const values = samples.map((sample) => sample[key]).sort((a, b) => a - b);
    return [key, values[1]];
  }));
  console.log(JSON.stringify({ samples, median }, null, 2));
} finally {
  browser.process()?.kill("SIGTERM");
}
process.exit(0);
