// Nationwide section verification — photo-driven cinematic (no background video).
// Asserts: correct responsive mode, three new photos in order, masked scene
// progression, sticky pin, no overlap/overflow/CLS, and reduced-motion flow.
// Usage: TEST_URL=http://127.0.0.1:4173 node scripts/verify-nationwide.mjs
import puppeteer from "puppeteer-core";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:4173";
const widths = [1440, 1280, 1024, 768, 430, 390, 360];
const cinematicBreakpoint = 768; // photos-cinematic runs at >= 768px
const EXPECTED_ORDER = ["arrival-door", "service-umbrella", "executive-exit"];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const report = { responsive: [], desktopStages: [], imageOrder: {}, reducedMotion: {}, consoleErrors: [], pageErrors: [], failures: [] };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createPage(width, reduced = false) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    window.__vitals = { cls: 0, longTasks: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      window.__vitals.longTasks.push(...list.getEntries().map((e) => Math.round(e.duration)));
    }).observe({ type: "longtask", buffered: true });
  });
  await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push({ width, text: m.text() }); });
  page.on("pageerror", (e) => report.pageErrors.push({ width, text: e.message }));
  await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
  return page;
}

try {
  for (const width of widths) {
    const page = await createPage(width);
    const state = await page.evaluate(() => {
      const section = document.querySelector("#nationwide-service");
      const pin = section.querySelector("[data-cinematic-pin]");
      const fallback = section.querySelector("[data-cinematic-fallback]");
      const isVisible = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && el.getClientRects().length > 0;
      };
      return {
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        sectionOverflow: section.scrollWidth > section.clientWidth + 1,
        pinVisible: isVisible(pin),
        fallbackVisible: isVisible(fallback),
        fallbackStories: fallback?.querySelectorAll("[data-stack-story]").length || 0,
        videoPresent: Boolean(section.querySelector("video")),
      };
    });
    report.responsive.push({ width, ...state });
    await page.evaluate(() => { window.__vitals = { cls: 0, longTasks: [] }; });

    if (width >= cinematicBreakpoint) {
      const geometry = await page.evaluate(() => {
        const pin = document.querySelector("[data-cinematic-pin]");
        const rect = pin.getBoundingClientRect();
        return { top: scrollY + rect.top, height: pin.offsetHeight, travel: pin.offsetHeight - innerHeight };
      });

      if (width === 1440) {
        report.imageOrder[width] = await page.evaluate(() => (
          [...document.querySelectorAll("[data-chapter-layer] img")].map((img) => img.getAttribute("src"))
        ));
      }

      for (const [index, progress] of [0.12, 0.42, 0.72, 0.9].entries()) {
        await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.travel * progress);
        await pause(650);
        const stage = await page.evaluate(() => {
          const scenes = [...document.querySelectorAll("[data-cinematic-scene]")].map((el) => ({
            opacity: Number(getComputedStyle(el).opacity),
            visibility: getComputedStyle(el).visibility,
          }));
          const pinned = document.querySelector("[data-cinematic-stage]");
          const rail = document.querySelector("[data-progress-stage]")?.parentElement;
          const visibleSceneEl = document.querySelectorAll("[data-cinematic-scene]")[scenes.findIndex((s) => s.opacity > 0.55 && s.visibility !== "hidden")];
          const overlaps = (a, b) => {
            if (!a || !b) return false;
            const r1 = a.getBoundingClientRect(); const r2 = b.getBoundingClientRect();
            return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
          };
          return {
            scenes,
            pinnedPosition: getComputedStyle(pinned).position,
            contentOverlap: overlaps(visibleSceneEl, rail),
          };
        });
        report.desktopStages.push({ width, scrollProgress: progress, expectedStage: index === 0 ? 1 : index === 1 ? 2 : 3, ...stage });
        if (width === 1440) await page.screenshot({ path: `/tmp/afsahi-cinematic-1440-${index + 1}.png`, captureBeyondViewport: false });
        if (width === 1024 && index === 1) await page.screenshot({ path: "/tmp/afsahi-cinematic-1024.png", captureBeyondViewport: false });
      }

      await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.height + 200);
      await pause(250);
      report.responsive.at(-1).escapedPin = await page.evaluate((end) => scrollY > end, geometry.top + geometry.travel);
    } else {
      const top = await page.evaluate(() => scrollY + document.querySelector("#nationwide-service").getBoundingClientRect().top);
      await page.evaluate((y) => scrollTo(0, y), top);
      await pause(300);
      if (width === 430) await page.screenshot({ path: "/tmp/afsahi-cinematic-430.png", captureBeyondViewport: false });
    }

    const vitals = await page.evaluate(() => window.__vitals);
    report.responsive.at(-1).cls = Number(vitals.cls.toFixed(4));
    report.responsive.at(-1).longTasksOver100ms = vitals.longTasks.filter((d) => d > 100);
    await page.close();
  }

  const reducedPage = await createPage(1440, true);
  await reducedPage.evaluate(() => scrollTo(0, document.querySelector("#nationwide-service").offsetTop));
  await pause(300);
  report.reducedMotion = await reducedPage.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    const fallback = section.querySelector("[data-cinematic-fallback]");
    return {
      fallbackStories: fallback?.querySelectorAll("[data-stack-story]").length || 0,
      pinPresent: Boolean(section.querySelector("[data-cinematic-pin]")),
      videoPresent: Boolean(section.querySelector("video")),
      runningAnimations: document.getAnimations().filter((a) => a.playState === "running").length,
      allHeadingsVisible: [...section.querySelectorAll("h3")].every((h) => getComputedStyle(h).visibility === "visible"),
      sectionOverflow: section.scrollWidth > section.clientWidth + 1,
    };
  });
  await reducedPage.close();

  // Assertions
  for (const item of report.responsive) {
    if (item.pageOverflow || item.sectionOverflow) report.failures.push(`Overflow at ${item.width}px`);
    if (item.cls > 0.02) report.failures.push(`Layout shift at ${item.width}px: ${item.cls}`);
    if (item.longTasksOver100ms?.length) report.failures.push(`Long task >100ms at ${item.width}px`);
    if (item.videoPresent) report.failures.push(`Video still present at ${item.width}px`);
    if (item.width >= cinematicBreakpoint && (!item.pinVisible || item.fallbackVisible || !item.escapedPin)) {
      report.failures.push(`Cinematic pin failed at ${item.width}px`);
    }
    if (item.width < cinematicBreakpoint && (item.pinVisible || !item.fallbackVisible || item.fallbackStories !== 3)) {
      report.failures.push(`Stacked fallback failed at ${item.width}px`);
    }
  }
  for (const item of report.desktopStages) {
    const visibleScene = item.scenes.findIndex((s) => s.opacity > 0.55 && s.visibility !== "hidden") + 1;
    if (visibleScene !== item.expectedStage) report.failures.push(`Scene ${item.expectedStage} not stable at ${item.width}px / ${item.scrollProgress} (saw ${visibleScene})`);
    if (item.pinnedPosition !== "sticky") report.failures.push(`Sticky stage inactive at ${item.width}px / ${item.scrollProgress}`);
    if (item.contentOverlap) report.failures.push(`Scene/progress overlap at ${item.width}px / ${item.scrollProgress}`);
  }
  const order = (report.imageOrder[1440] || []).map((src) => EXPECTED_ORDER.find((base) => src?.includes(base)) || src);
  if (order.join(",") !== EXPECTED_ORDER.join(",")) report.failures.push(`Image order wrong: ${JSON.stringify(order)}`);
  const rm = report.reducedMotion;
  if (rm.fallbackStories !== 3 || rm.pinPresent || rm.videoPresent || !rm.allHeadingsVisible || rm.runningAnimations !== 0 || rm.sectionOverflow) {
    report.failures.push("Reduced-motion fallback failed");
  }
  if (report.consoleErrors.length || report.pageErrors.length) report.failures.push("Browser errors detected");

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGTERM");
}
