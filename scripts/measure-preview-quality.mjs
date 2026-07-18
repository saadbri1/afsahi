import { readFile, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const target = process.env.TEST_URL;
const cookieFile = process.env.VERCEL_COOKIE_FILE || "/tmp/afsahi-vercel-preview.cookies";
const outputDir = process.env.OUTPUT_DIR;

if (!target || !outputDir) {
  throw new Error("TEST_URL and OUTPUT_DIR are required.");
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
if (!cookies.some((cookie) => cookie.name === "_vercel_jwt")) {
  throw new Error("The temporary Vercel Preview cookie is missing.");
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=CalculateNativeWinOcclusion",
  ],
});

const report = {
  target,
  viewportChecks: [],
  stageChecks: [],
  frameTiming: null,
  cumulativeLayoutShift: 0,
  reducedMotion: null,
  consoleErrors: [],
  pageErrors: [],
  failures: [],
};

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function preparePage(width, height, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
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
  await page.goto(target, { waitUntil: "networkidle0", timeout: 30000 });
  if ((await page.title()).includes("Log in to Vercel")) {
    throw new Error("Preview protection was not bypassed.");
  }
  await pause(500);
  return page;
}

async function getGeometry(page) {
  return page.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    const top = section.getBoundingClientRect().top + scrollY;
    return { top, height: section.offsetHeight, travel: section.offsetHeight - innerHeight };
  });
}

async function inspectViewport(page, width) {
  return page.evaluate((viewportWidth) => {
    const section = document.querySelector("#nationwide-service");
    const desktop = section.querySelector("[data-nationwide-desktop]");
    const sticky = desktop?.firstElementChild;
    const stories = [...section.querySelectorAll("article.border-t")]
      .filter((element) => getComputedStyle(element).display !== "none");
    const storyOverlap = stories.some((story, index) => {
      if (!index) return false;
      const previous = stories[index - 1].getBoundingClientRect();
      const current = story.getBoundingClientRect();
      return previous.bottom > current.top + 1;
    });
    return {
      width: viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      sectionOverflow: section.scrollWidth > section.clientWidth + 1,
      desktopStoryVisible: Boolean(desktop && getComputedStyle(desktop).display !== "none"),
      stickyPosition: sticky ? getComputedStyle(sticky).position : null,
      visibleStackedStories: stories.length,
      stackedStoryOverlap: storyOverlap,
      cls: Number((window.__previewCls || 0).toFixed(4)),
    };
  }, width);
}

async function inspectStage(page, expectedStage) {
  return page.evaluate((expected) => {
    const desktop = document.querySelector("[data-nationwide-desktop]");
    const columns = desktop.querySelectorAll(":scope > div > div > div");
    const left = columns[0].getBoundingClientRect();
    const visual = columns[1].getBoundingClientRect();
    const images = [...desktop.querySelectorAll("[data-nationwide-image]")];
    const panels = [...desktop.querySelectorAll("[data-nationwide-panel]")];
    const visibleImage = images.findIndex((element) => Number(getComputedStyle(element).opacity) > 0.55) + 1;
    const visiblePanelIndex = panels.findIndex((element) => Number(getComputedStyle(element).opacity) > 0.55);
    const panel = panels[visiblePanelIndex];
    const title = panel?.querySelector("h3")?.getBoundingClientRect();
    const body = panel?.querySelector("p:last-child")?.getBoundingClientRect();
    const route = desktop.querySelector("[data-nationwide-map] [data-route-line]");
    const routeStyle = route ? getComputedStyle(route) : null;
    const overlaps = left.right > visual.left && left.left < visual.right
      && left.bottom > visual.top && left.top < visual.bottom;
    const within = (rect, boundary) => rect && rect.left >= boundary.left - 1
      && rect.right <= boundary.right + 1 && rect.top >= boundary.top - 1
      && rect.bottom <= boundary.bottom + 1;
    return {
      expectedStage: expected,
      visibleImage,
      visiblePanel: visiblePanelIndex + 1,
      columnsOverlap: overlaps,
      titleWithinStage: within(title, visual),
      bodyWithinStage: within(body, visual),
      titleBodyOverlap: Boolean(title && body && title.bottom > body.top + 1),
      routeDashOffset: routeStyle ? Number.parseFloat(routeStyle.strokeDashoffset).toFixed(2) : null,
    };
  }, expectedStage);
}

async function smoothScroll(page, destination, duration) {
  return page.evaluate(({ targetY, milliseconds }) => new Promise((resolve) => {
    const from = scrollY;
    const distance = targetY - from;
    const started = performance.now();
    const deltas = [];
    let previous = started;
    function frame(now) {
      const progress = Math.min(1, (now - started) / milliseconds);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      scrollTo(0, from + distance * eased);
      deltas.push(now - previous);
      previous = now;
      if (progress < 1) requestAnimationFrame(frame);
      else resolve(deltas.slice(1));
    }
    requestAnimationFrame(frame);
  }), { targetY: destination, milliseconds: duration });
}

try {
  for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [768, 900], [430, 932], [390, 844], [360, 800]]) {
    const page = await preparePage(width, height);
    const geometry = await getGeometry(page);
    await page.evaluate((y) => scrollTo(0, y), geometry.top + Math.max(0, geometry.travel) * 0.5);
    await pause(1000);
    const check = await inspectViewport(page, width);
    report.viewportChecks.push(check);
    report.cumulativeLayoutShift = Math.max(report.cumulativeLayoutShift, check.cls);
    await page.close();
  }

  const page = await preparePage(1440, 900);
  const geometry = await getGeometry(page);
  for (const [index, progress] of [0.08, 0.5, 0.92].entries()) {
    await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.travel * progress);
    await pause(1200);
    report.stageChecks.push(await inspectStage(page, index + 1));
  }

  await page.evaluate((y) => scrollTo(0, y), Math.max(0, geometry.top - 900 * 0.9));
  const frameDeltas = [];
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.08, 1500));
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.5, 2600));
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.travel * 0.92, 2600));
  frameDeltas.push(...await smoothScroll(page, geometry.top + geometry.height + 200, 1800));
  const sorted = [...frameDeltas].sort((a, b) => a - b);
  const mean = frameDeltas.reduce((sum, value) => sum + value, 0) / frameDeltas.length;
  report.frameTiming = {
    sampledFrames: frameDeltas.length,
    averageFps: Number((1000 / mean).toFixed(1)),
    p95FrameMs: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
    maxFrameMs: Number(sorted.at(-1).toFixed(2)),
    framesOver33ms: frameDeltas.filter((value) => value > 33.34).length,
    framesOver50ms: frameDeltas.filter((value) => value > 50).length,
    framesOver50msPercent: Number((frameDeltas.filter((value) => value > 50).length / frameDeltas.length * 100).toFixed(2)),
    exitedStickySection: await page.evaluate((end) => scrollY > end, geometry.top + geometry.travel),
  };
  report.cumulativeLayoutShift = Math.max(
    report.cumulativeLayoutShift,
    await page.evaluate(() => Number((window.__previewCls || 0).toFixed(4))),
  );
  await page.close();

  const reducedPage = await preparePage(1440, 900, true);
  report.reducedMotion = await reducedPage.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    return {
      stackedStories: section.querySelectorAll("article.border-t").length,
      stickyStoryPresent: Boolean(section.querySelector("[data-nationwide-desktop]")),
      runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
    };
  });
  await reducedPage.close();

  for (const check of report.viewportChecks) {
    if (check.horizontalOverflow || check.sectionOverflow) report.failures.push(`Overflow at ${check.width}px.`);
    if (check.stackedStoryOverlap) report.failures.push(`Stacked stories overlap at ${check.width}px.`);
    if (check.width >= 1024 && (!check.desktopStoryVisible || check.stickyPosition !== "sticky")) {
      report.failures.push(`Desktop sticky mode failed at ${check.width}px.`);
    }
    if (check.width < 1024 && (check.desktopStoryVisible || check.visibleStackedStories !== 3)) {
      report.failures.push(`Stacked mobile/tablet mode failed at ${check.width}px.`);
    }
  }
  for (const stage of report.stageChecks) {
    if (stage.visibleImage !== stage.expectedStage || stage.visiblePanel !== stage.expectedStage
      || stage.columnsOverlap || !stage.titleWithinStage || !stage.bodyWithinStage || stage.titleBodyOverlap) {
      report.failures.push(`Stage ${stage.expectedStage} has a visibility or overlap issue.`);
    }
  }
  if (report.cumulativeLayoutShift > 0.01) report.failures.push("Cumulative layout shift exceeded 0.01.");
  if (!report.frameTiming.exitedStickySection) report.failures.push("Sticky section did not release scrolling.");
  if (report.frameTiming.p95FrameMs > 33.34 || report.frameTiming.framesOver50msPercent > 1) {
    report.failures.push("Scroll frame timing showed sustained jank.");
  }
  if (report.reducedMotion.stackedStories !== 3 || report.reducedMotion.stickyStoryPresent
    || report.reducedMotion.runningAnimations !== 0) {
    report.failures.push("Reduced-motion fallback failed.");
  }
  if (report.consoleErrors.length || report.pageErrors.length) report.failures.push("Browser errors were detected.");

  await writeFile(`${outputDir}/afsahi-preview-quality.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGTERM");
}
