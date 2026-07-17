import puppeteer from "puppeteer-core";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:4173";
const widths = [1440, 1280, 1024, 768, 430, 390, 360];
const desktopBreakpoint = 1100;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=user-gesture-required"],
});

const report = {
  responsive: [],
  desktopStages: [],
  reducedMotion: {},
  consoleErrors: [],
  pageErrors: [],
  failures: [],
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createPage(width, reduced = false) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    window.__nationwideVitals = { cls: 0, longTasks: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__nationwideVitals.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      window.__nationwideVitals.longTasks.push(...list.getEntries().map((entry) => Math.round(entry.duration)));
    }).observe({ type: "longtask", buffered: true });
  });
  await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ width, text: message.text() });
  });
  page.on("pageerror", (error) => report.pageErrors.push({ width, text: error.message }));
  await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
  return page;
}

function visible(element) {
  if (!element) return false;
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
}

try {
  for (const width of widths) {
    const page = await createPage(width);
    const state = await page.evaluate(() => {
      const section = document.querySelector("#nationwide-service");
      const desktop = section.querySelector("[data-cinematic-desktop]");
      const fallback = section.querySelector("[data-cinematic-fallback]");
      const isVisible = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
      };
      return {
        sectionHeight: Math.round(section.getBoundingClientRect().height),
        viewportHeight: innerHeight,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        sectionOverflow: section.scrollWidth > section.clientWidth + 1,
        desktopVisible: isVisible(desktop),
        fallbackVisible: isVisible(fallback),
        fallbackStories: fallback?.querySelectorAll("[data-fallback-story]").length || 0,
        videoPresent: Boolean(section.querySelector("[data-cinematic-video]")),
      };
    });
    report.responsive.push({ width, ...state });
    await page.evaluate(() => {
      window.__nationwideVitals = { cls: 0, longTasks: [] };
    });

    if (width >= desktopBreakpoint) {
      const geometry = await page.evaluate(() => {
        const desktop = document.querySelector("[data-cinematic-desktop]");
        const rect = desktop.getBoundingClientRect();
        return {
          top: scrollY + rect.top,
          height: desktop.offsetHeight,
          travel: desktop.offsetHeight - innerHeight,
        };
      });

      for (const [index, progress] of [0.06, 0.4, 0.72, 0.95].entries()) {
        await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.travel * progress);
        await pause(700);
        const stage = await page.evaluate(() => {
          const scenes = [...document.querySelectorAll("[data-cinematic-scene]")].map((element) => ({
            opacity: Number(getComputedStyle(element).opacity),
            visibility: getComputedStyle(element).visibility,
            text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 140),
          }));
          const progressItems = [...document.querySelectorAll("[data-progress-stage]")].map((element) => Number(getComputedStyle(element).opacity));
          const routeOffsets = [...document.querySelectorAll("[data-cinematic-desktop] [data-route-line]")]
            .map((element) => Number.parseFloat(getComputedStyle(element).strokeDashoffset));
          const video = document.querySelector("[data-cinematic-video]");
          const pinned = document.querySelector("[data-cinematic-stage]");
          const visibleScene = document.querySelectorAll("[data-cinematic-scene]")[[...scenes].findIndex((scene) => scene.opacity > 0.55)];
          const progressRail = document.querySelector("[data-progress-stage]")?.parentElement;
          const overlaps = (one, two) => {
            if (!one || !two) return false;
            const a = one.getBoundingClientRect();
            const b = two.getBoundingClientRect();
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          };
          return {
            scenes,
            progressItems,
            routeOffsets,
            videoTime: Number(video?.currentTime.toFixed(3)),
            videoPaused: video?.paused,
            pinnedPosition: getComputedStyle(pinned).position,
            contentOverlap: overlaps(visibleScene, progressRail),
          };
        });
        const expectedStage = index === 0 ? 1 : index === 1 ? 2 : 3;
        report.desktopStages.push({ width, scrollProgress: progress, expectedStage, ...stage });
        if (width === 1440) {
          await page.screenshot({ path: `/tmp/afsahi-cinematic-1440-${index + 1}.png`, captureBeyondViewport: false });
        }
      }

      await page.evaluate((y) => scrollTo(0, y), geometry.top + geometry.height + 160);
      await pause(250);
      const escapedPin = await page.evaluate((end) => scrollY > end, geometry.top + geometry.travel);
      report.responsive.at(-1).escapedPin = escapedPin;
    } else {
      const top = await page.evaluate(() => {
        const section = document.querySelector("#nationwide-service");
        return scrollY + section.getBoundingClientRect().top;
      });
      await page.evaluate((y) => scrollTo(0, y), top);
      await pause(250);
      if (width === 1024 || width === 430) {
        await page.screenshot({ path: `/tmp/afsahi-cinematic-${width}.png`, captureBeyondViewport: false });
      }
    }

    const vitals = await page.evaluate(() => window.__nationwideVitals);
    report.responsive.at(-1).cls = Number(vitals.cls.toFixed(4));
    report.responsive.at(-1).longTasksOver100ms = vitals.longTasks.filter((duration) => duration > 100);
    await page.close();
  }

  const reducedPage = await createPage(1440, true);
  report.reducedMotion = await reducedPage.evaluate(() => {
    const section = document.querySelector("#nationwide-service");
    const fallback = section.querySelector("[data-cinematic-fallback]");
    return {
      fallbackStories: fallback?.querySelectorAll("[data-fallback-story]").length || 0,
      desktopStoryPresent: Boolean(section.querySelector("[data-cinematic-desktop]")),
      videoPresent: Boolean(section.querySelector("video")),
      runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
      allHeadingsVisible: [...section.querySelectorAll("h3")].every((heading) => getComputedStyle(heading).visibility === "visible"),
      sectionOverflow: section.scrollWidth > section.clientWidth + 1,
    };
  });
  await reducedPage.close();

  for (const item of report.responsive) {
    if (item.pageOverflow || item.sectionOverflow) report.failures.push(`Overflow at ${item.width}px`);
    if (item.cls > 0.02) report.failures.push(`Layout shift at ${item.width}px: ${item.cls}`);
    if (item.longTasksOver100ms.length) report.failures.push(`Long task over 100ms at ${item.width}px`);
    if (item.width >= desktopBreakpoint && (!item.desktopVisible || item.fallbackVisible || !item.videoPresent || !item.escapedPin)) {
      report.failures.push(`Desktop cinematic layout failed at ${item.width}px`);
    }
    if (item.width < desktopBreakpoint && (item.desktopVisible || !item.fallbackVisible || item.fallbackStories !== 3 || item.videoPresent)) {
      report.failures.push(`Lightweight fallback failed at ${item.width}px`);
    }
  }

  for (const item of report.desktopStages) {
    const visibleScene = item.scenes.findIndex((scene) => scene.opacity > 0.55 && scene.visibility !== "hidden") + 1;
    if (visibleScene !== item.expectedStage) report.failures.push(`Scene ${item.expectedStage} was not stable at ${item.width}px / ${item.scrollProgress}`);
    if (!item.videoPaused) report.failures.push(`Video autoplayed at ${item.width}px`);
    if (item.pinnedPosition !== "sticky") report.failures.push(`Sticky stage was not active at ${item.width}px / ${item.scrollProgress}`);
    if (item.contentOverlap) report.failures.push(`Editorial content overlap at ${item.width}px / ${item.scrollProgress}`);
  }

  for (const width of [1440, 1280]) {
    const samples = report.desktopStages.filter((stage) => stage.width === width);
    if (!samples.every((sample, index) => index === 0 || sample.videoTime > samples[index - 1].videoTime + 1)) {
      report.failures.push(`Video scrub did not progress at ${width}px`);
    }
  }

  if (report.reducedMotion.fallbackStories !== 3 || report.reducedMotion.desktopStoryPresent
    || report.reducedMotion.videoPresent || !report.reducedMotion.allHeadingsVisible
    || report.reducedMotion.runningAnimations !== 0 || report.reducedMotion.sectionOverflow) {
    report.failures.push("Reduced-motion fallback failed");
  }
  if (report.consoleErrors.length || report.pageErrors.length) report.failures.push("Browser errors detected");

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGTERM");
}
