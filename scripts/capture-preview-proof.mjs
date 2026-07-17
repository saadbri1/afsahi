import { readFile, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const target = process.env.TEST_URL;
const cookieFile = process.env.VERCEL_COOKIE_FILE || "/tmp/afsahi-vercel-preview.cookies";
const outputDir = process.env.OUTPUT_DIR;
const ffmpegPath = process.env.FFMPEG_PATH;

if (!target || !outputDir || !ffmpegPath) {
  throw new Error("TEST_URL, OUTPUT_DIR and FFMPEG_PATH are required.");
}

function parseCookies(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    if (!line || (line.startsWith("#") && !line.startsWith("#HttpOnly_"))) return [];
    const fields = line.split("\t");
    if (fields.length < 7) return [];
    const httpOnly = fields[0].startsWith("#HttpOnly_");
    return [{
      domain: fields[0].replace("#HttpOnly_", ""),
      path: fields[2],
      secure: fields[3] === "TRUE",
      expires: Number(fields[4]),
      name: fields[5],
      value: fields[6],
      httpOnly,
    }];
  });
}

const cookies = parseCookies(await readFile(cookieFile, "utf8"));
if (!cookies.some((cookie) => cookie.name === "_vercel_jwt")) {
  throw new Error("The temporary Vercel Preview cookie is missing.");
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

const report = {
  target,
  screenshots: [],
  video: null,
  viewportChecks: [],
  stageChecks: [],
  frameTiming: null,
  cumulativeLayoutShift: 0,
  consoleErrors: [],
  pageErrors: [],
  failures: [],
};

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function preparePage(width, height, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setCookie(...cookies);
  await page.evaluateOnNewDocument(() => {
    window.__previewCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__previewCls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ width, message: message.text() });
  });
  page.on("pageerror", (error) => report.pageErrors.push({ width, message: error.message }));
  await page.goto(target, { waitUntil: "networkidle0", timeout: 25000 });
  if ((await page.title()).includes("Log in to Vercel")) throw new Error("Preview protection was not bypassed.");
  return page;
}

async function warmLazyImages(page) {
  const { height, viewport } = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, viewport: innerHeight }));
  for (let y = 0; y < height; y += Math.max(500, viewport * 0.82)) {
    await page.evaluate((position) => scrollTo(0, position), y);
    await pause(65);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await pause(900);
}

async function pageQuality(page, width) {
  return page.evaluate((viewportWidth) => {
    const section = document.querySelector("#nationwide-service");
    const desktop = section.querySelector("[data-nationwide-desktop]");
    const sticky = desktop?.firstElementChild;
    const visibleStories = [...section.querySelectorAll("article.border-t")]
      .filter((element) => getComputedStyle(element).display !== "none").length;
    return {
      width: viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      sectionOverflow: section.scrollWidth > section.clientWidth + 1,
      stickyVisible: Boolean(desktop && getComputedStyle(desktop).display !== "none"),
      stickyPosition: sticky ? getComputedStyle(sticky).position : null,
      visibleStackedStories: visibleStories,
      cls: Number((window.__previewCls || 0).toFixed(4)),
    };
  }, width);
}

async function smoothScroll(page, targetY, duration) {
  return page.evaluate(({ destination, milliseconds }) => new Promise((resolve) => {
    const startY = scrollY;
    const distance = destination - startY;
    const started = performance.now();
    const deltas = [];
    let previous = started;
    function frame(now) {
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / milliseconds);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      scrollTo(0, startY + distance * eased);
      if (now !== started) deltas.push(now - previous);
      previous = now;
      if (progress < 1) requestAnimationFrame(frame);
      else resolve(deltas);
    }
    requestAnimationFrame(frame);
  }), { destination: targetY, milliseconds: duration });
}

async function sectionGeometry(page) {
  return page.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    const top = section.getBoundingClientRect().top + scrollY;
    return { top, height: section.offsetHeight, travel: section.offsetHeight - innerHeight, viewport: innerHeight };
  });
}

async function inspectStage(page, expectedStage) {
  return page.evaluate((expected) => {
    const section = document.querySelector("#nationwide-service");
    const desktop = section.querySelector("[data-nationwide-desktop]");
    const left = desktop.querySelector(".wrap > div:first-child").getBoundingClientRect();
    const stage = desktop.querySelector(".wrap > div:last-child").getBoundingClientRect();
    const images = [...desktop.querySelectorAll("[data-nationwide-image]")];
    const panels = [...desktop.querySelectorAll("[data-nationwide-panel]")];
    const visibleImage = images.findIndex((element) => Number(getComputedStyle(element).opacity) > 0.55) + 1;
    const visiblePanelIndex = panels.findIndex((element) => Number(getComputedStyle(element).opacity) > 0.55);
    const panel = panels[visiblePanelIndex];
    const title = panel?.querySelector("h3")?.getBoundingClientRect();
    const body = panel?.querySelector("p:last-child")?.getBoundingClientRect();
    const intersects = left.right > stage.left && left.left < stage.right && left.bottom > stage.top && left.top < stage.bottom;
    const within = (rect, boundary) => rect && rect.left >= boundary.left - 1 && rect.right <= boundary.right + 1
      && rect.top >= boundary.top - 1 && rect.bottom <= boundary.bottom + 1;
    return {
      expectedStage: expected,
      visibleImage,
      visiblePanel: visiblePanelIndex + 1,
      columnsOverlap: intersects,
      titleWithinStage: within(title, stage),
      bodyWithinStage: within(body, stage),
      titleBodyOverlap: Boolean(title && body && title.bottom > body.top + 1),
    };
  }, expectedStage);
}

try {
  for (const [width, height] of [[1440, 900], [1024, 900], [430, 932]]) {
    const page = await preparePage(width, height);
    await warmLazyImages(page);
    const quality = await pageQuality(page, width);
    report.viewportChecks.push(quality);
    report.cumulativeLayoutShift = Math.max(report.cumulativeLayoutShift, quality.cls);
    const screenshotPath = `${outputDir}/afsahi-preview-full-${width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true, optimizeForSpeed: false });
    report.screenshots.push(screenshotPath);
    await page.close();
  }

  const page = await preparePage(1440, 900);
  const geometry = await sectionGeometry(page);
  for (const [index, progress] of [0.08, 0.5, 0.92].entries()) {
    await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.travel * progress);
    await pause(1400);
    const stage = await inspectStage(page, index + 1);
    report.stageChecks.push(stage);
    const stillPath = `${outputDir}/afsahi-preview-stage-${index + 1}.png`;
    await page.screenshot({ path: stillPath, captureBeyondViewport: false });
    report.screenshots.push(stillPath);
  }

  await page.evaluate((y) => scrollTo(0, y), Math.max(0, geometry.top - geometry.viewport * 0.94));
  await pause(500);
  const videoPath = `${outputDir}/afsahi-preview-sticky-story.webm`;
  const recorder = await page.screencast({
    path: videoPath,
    ffmpegPath,
    format: "webm",
    fps: 30,
    quality: 24,
    scale: 0.8,
  });

  const frameDeltas = [];
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.05, 3200));
  await page.hover("[data-nationwide-desktop] button");
  await page.focus("[data-nationwide-desktop] button");
  await pause(1800);
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.2, 3200));
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.52, 5900));
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.9, 5900));
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.height + 240, 4000));
  await pause(1100);
  await recorder.stop();

  const sorted = [...frameDeltas].sort((a, b) => a - b);
  const mean = frameDeltas.reduce((sum, value) => sum + value, 0) / frameDeltas.length;
  report.frameTiming = {
    sampledFrames: frameDeltas.length,
    averageFps: Number((1000 / mean).toFixed(1)),
    p95FrameMs: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
    maxFrameMs: Number(sorted.at(-1).toFixed(2)),
    framesOver33ms: frameDeltas.filter((value) => value > 33.34).length,
    framesOver50ms: frameDeltas.filter((value) => value > 50).length,
  };
  report.video = { path: videoPath, plannedDurationSeconds: 25.1 };
  report.cumulativeLayoutShift = Math.max(
    report.cumulativeLayoutShift,
    await page.evaluate(() => Number((window.__previewCls || 0).toFixed(4)))
  );
  const escapedSticky = await page.evaluate((end) => scrollY > end, geometry.top + geometry.travel);
  if (!escapedSticky) report.failures.push("The recording did not exit the sticky section.");
  await page.close();

  const reducedPage = await preparePage(1440, 900, true);
  const reduced = await reducedPage.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    return {
      stackedStories: section.querySelectorAll("article.border-t").length,
      stickyStoryPresent: Boolean(section.querySelector("[data-nationwide-desktop]")),
      runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
    };
  });
  report.reducedMotion = reduced;
  await reducedPage.close();

  for (const item of report.viewportChecks) {
    if (item.horizontalOverflow || item.sectionOverflow) report.failures.push(`Overflow at ${item.width}px.`);
  }
  for (const stage of report.stageChecks) {
    if (stage.visibleImage !== stage.expectedStage || stage.visiblePanel !== stage.expectedStage
      || stage.columnsOverlap || !stage.titleWithinStage || !stage.bodyWithinStage || stage.titleBodyOverlap) {
      report.failures.push(`Stage ${stage.expectedStage} has a visibility or overlap issue.`);
    }
  }
  if (report.cumulativeLayoutShift > 0.01) report.failures.push("Cumulative layout shift exceeded 0.01.");
  if (report.reducedMotion.stackedStories !== 3 || report.reducedMotion.stickyStoryPresent
    || report.reducedMotion.runningAnimations !== 0) report.failures.push("Reduced-motion fallback failed.");
  if (report.consoleErrors.length || report.pageErrors.length) report.failures.push("Browser errors were detected.");

  await writeFile(`${outputDir}/afsahi-preview-quality.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGTERM");
}
