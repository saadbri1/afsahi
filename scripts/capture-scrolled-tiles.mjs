import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const manifest = [];

try {
  for (const [width, height] of [[1440, 900], [1024, 900], [430, 932]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setCookie(...cookies);
    await page.goto(target, { waitUntil: "networkidle0", timeout: 30000 });
    await pause(1600);

    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const positions = [];
    for (let y = 0; y < pageHeight - height; y += height) positions.push(y);
    positions.push(Math.max(0, pageHeight - height));
    const uniquePositions = [...new Set(positions)];
    const tileDir = `${outputDir}/tiles-${width}`;
    await mkdir(tileDir, { recursive: true });
    const tiles = [];

    for (const [index, y] of uniquePositions.entries()) {
      await page.evaluate((position) => scrollTo(0, position), y);
      await pause(index === 0 ? 1200 : 520);
      if (index === 1) {
        await page.evaluate(() => {
          for (const element of document.body.querySelectorAll("*")) {
            if (getComputedStyle(element).position === "fixed") element.style.visibility = "hidden";
          }
        });
      }
      const path = `${tileDir}/tile-${String(index).padStart(3, "0")}.png`;
      await page.screenshot({ path, captureBeyondViewport: false, optimizeForSpeed: false });
      tiles.push({ path, y });
    }

    manifest.push({ width, height: pageHeight, output: `${outputDir}/afsahi-preview-full-${width}.png`, tiles });
    await page.close();
  }

  await writeFile(`${outputDir}/afsahi-fullpage-tiles.json`, JSON.stringify(manifest, null, 2));
} finally {
  browser.process()?.kill("SIGTERM");
}
