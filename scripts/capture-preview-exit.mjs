import { readFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const target = process.env.TEST_URL;
const outputDir = process.env.OUTPUT_DIR;
const ffmpegPath = process.env.FFMPEG_PATH;
const cookieFile = process.env.VERCEL_COOKIE_FILE || "/tmp/afsahi-vercel-preview.cookies";

if (!target || !outputDir || !ffmpegPath) {
  throw new Error("TEST_URL, OUTPUT_DIR and FFMPEG_PATH are required.");
}

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

async function smoothScroll(page, targetY, duration) {
  await page.evaluate(({ destination, milliseconds }) => new Promise((resolve) => {
    const start = scrollY;
    const distance = destination - start;
    const began = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - began) / milliseconds);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      scrollTo(0, start + distance * eased);
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  }), { destination: targetY, milliseconds: duration });
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setCookie(...cookies);
  await page.goto(target, { waitUntil: "networkidle0", timeout: 30000 });
  const geometry = await page.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    const top = section.getBoundingClientRect().top + scrollY;
    return { top, height: section.offsetHeight, travel: section.offsetHeight - innerHeight };
  });
  await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.travel * 0.92);
  await pause(1500);

  const recorder = await page.screencast({
    path: `${outputDir}/afsahi-preview-exit.webm`,
    ffmpegPath,
    format: "webm",
    fps: 20,
    quality: 28,
    scale: 0.8,
  });
  await pause(700);
  await smoothScroll(page, geometry.top + geometry.height + 260, 4200);
  await pause(900);
  await recorder.stop();
  await page.close();
} finally {
  browser.process()?.kill("SIGTERM");
}
