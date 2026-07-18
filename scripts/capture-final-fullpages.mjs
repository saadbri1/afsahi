import { readFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const target = process.env.TEST_URL;
const outputDir = process.env.OUTPUT_DIR;
const cookieFile = process.env.VERCEL_COOKIE_FILE || "/tmp/afsahi-vercel-preview.cookies";

if (!target || !outputDir) throw new Error("TEST_URL and OUTPUT_DIR are required.");

function parseCookies(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    if (!line || (line.startsWith("#") && !line.startsWith("#HttpOnly_"))) return [];
    const fields = line.split("\t");
    if (fields.length < 7) return [];
    return [{
      domain: fields[0].replace("#HttpOnly_", ""),
      path: fields[2],
      secure: fields[3] === "TRUE",
      expires: Number(fields[4]),
      name: fields[5],
      value: fields[6],
      httpOnly: fields[0].startsWith("#HttpOnly_"),
    }];
  });
}

const cookies = parseCookies(await readFile(cookieFile, "utf8"));
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  for (const [width, height] of [[1440, 900], [1024, 900], [430, 932]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setCookie(...cookies);
    await page.goto(target, { waitUntil: "networkidle0", timeout: 30000 });

    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < pageHeight; y += Math.max(360, height * 0.68)) {
      await page.evaluate((position) => scrollTo(0, position), y);
      await pause(180);
    }
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await pause(1600);
    await page.waitForFunction(
      () => [...document.images].filter((image) => image.getBoundingClientRect().top < document.documentElement.scrollHeight)
        .every((image) => image.complete),
      { timeout: 15000 },
    ).catch(() => {});
    await page.evaluate(() => scrollTo(0, 0));
    await pause(1800);

    await page.screenshot({
      path: `${outputDir}/afsahi-preview-full-${width}.png`,
      fullPage: true,
      optimizeForSpeed: false,
    });
    await page.close();
  }
} finally {
  browser.process()?.kill("SIGTERM");
}
