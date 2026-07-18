import puppeteer from "puppeteer-core";
import { writeFile } from "node:fs/promises";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:4173";
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const widths = [1440, 1280, 1024, 768, 430, 390, 360];

const report = {
  stage: "starting",
  responsive: [],
  consoleErrors: [],
  pageErrors: [],
  security: {},
  navigation: {},
  booking: {},
  reducedMotion: {},
  performance: {},
  screenshots: [],
};

async function checkpoint(stage) {
  report.stage = stage;
  await writeFile("/tmp/afsahi-ui-partial.json", JSON.stringify(report, null, 2));
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function createPage(width = 1280, reducedMotion = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width <= 430 ? 844 : 900, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("https://nominatim.openstreetmap.org/")) {
      request.respond({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: "[]" });
    } else if (url.startsWith("https://router.project-osrm.org/")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          code: "Ok",
          routes: [{
            distance: 120000,
            duration: 7200,
            geometry: { coordinates: [[-7.5898, 33.5731], [-7.9811, 31.6295]] },
          }],
        }),
      });
    } else if (/\.tile\.openstreetmap\.org\//.test(url)) {
      request.respond({ status: 204 });
    } else {
      request.continue();
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ url: page.url(), text: message.text() });
  });
  page.on("pageerror", (error) => report.pageErrors.push({ url: page.url(), text: error.message }));
  return page;
}

async function goto(page, path = "/") {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await sleep(100);
}

try {
  const responsivePage = await createPage(1440);
  await goto(responsivePage);
  for (const width of widths) {
    await responsivePage.setViewport({ width, height: width <= 430 ? 844 : 900, deviceScaleFactor: 1 });
    await sleep(50);
    const overflow = await responsivePage.evaluate(() => {
      const root = document.documentElement;
      const offenders = [...document.querySelectorAll("body *")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.position === "fixed" || style.position === "absolute") return false;
          const rect = element.getBoundingClientRect();
          return rect.right > window.innerWidth + 2 || rect.left < -2;
        })
        .slice(0, 8)
        .map((element) => ({ tag: element.tagName, className: String(element.className).slice(0, 90) }));
      return {
        scrollWidth: root.scrollWidth,
        viewportWidth: window.innerWidth,
        bodyOverflow: root.scrollWidth > window.innerWidth + 1,
        offenders,
      };
    });
    report.responsive.push({ width, ...overflow });
    if (width === 1440 || width === 390) {
      const path = `/tmp/afsahi-home-${width}.png`;
      if (process.env.CAPTURE_SCREENSHOTS === "1") {
        await responsivePage.screenshot({ path, fullPage: true });
      }
      report.screenshots.push(path);
    }
  }
  await checkpoint("responsive-complete");
  const page = responsivePage;
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await sleep(200);
  const initialResources = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  report.security.homeLoadedAdminCode = initialResources.some((url) => /AdminDashboard|Overview-|ReservationsTable/.test(url));
  report.security.homeContactedSupabase = initialResources.some((url) => url.includes("supabase.co"));

  await page.click('nav[aria-label="Primary navigation"] a[href="#nationwide-service"]');
  await sleep(600);
  report.navigation.anchor = await page.evaluate(() => {
    const header = document.querySelector("header").getBoundingClientRect();
    const target = document.querySelector("#nationwide-service").getBoundingClientRect();
    return {
      hash: location.hash,
      fleetTop: Math.round(target.top),
      headerBottom: Math.round(header.bottom),
      aligned: target.top >= header.bottom - 3 && target.top <= header.bottom + 8,
    };
  });
  await page.evaluate(() => history.back());
  await sleep(250);
  const afterBack = await page.evaluate(() => ({ hash: location.hash, scrollY: Math.round(scrollY) }));
  await page.evaluate(() => history.forward());
  await sleep(250);
  const afterForward = await page.evaluate(() => ({ hash: location.hash, scrollY: Math.round(scrollY) }));
  report.navigation.history = { afterBack, afterForward };

  await page.evaluate(() => {
    history.replaceState({}, "", "/");
    scrollTo(0, 0);
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press("Tab");
  report.navigation.keyboard = await page.evaluate(() => ({
    firstFocusClass: document.activeElement?.className,
    firstFocusText: document.activeElement?.textContent?.trim(),
  }));
  await checkpoint("navigation-complete");

  const locationInputs = await page.$$('form#book input[role="combobox"]');
  await locationInputs[0].type("Casablanca");
  await locationInputs[1].type("Marrakech");
  await page.$eval('form#book input[type="date"]', (input) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "2026-08-10");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.$eval('form#book input[type="time"]', (input) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "10:30");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.click('form#book button[type="submit"]');
  await checkpoint("booking-submitted");
  await sleep(500);
  report.booking.preNavigation = await page.evaluate(() => ({
    path: location.pathname,
    values: [...document.querySelectorAll("form#book input")].map((input) => ({ type: input.type, value: input.value })),
    submitText: document.querySelector('form#book button[type="submit"]')?.textContent?.trim(),
    formMessage: [...document.querySelectorAll("form#book p")].map((element) => element.textContent.trim()),
  }));
  await checkpoint("booking-state-recorded");
  if (locationInputs.length && report.booking.preNavigation.path === "/booking") {
    await checkpoint("booking-route-open");
    await page.waitForFunction(() => document.body.textContent.includes("120 km"), { timeout: 10000 });
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((element) => element.textContent.includes("Mercedes E-Class"));
      button?.click();
    });
    const details = await page.$$('input[autocomplete="name"], input[autocomplete="tel"], input[autocomplete="email"]');
    await details[0].type("Test Passenger");
    await details[1].type("+212600000000");
    await details[2].type("test@example.com");
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((element) => element.textContent.includes("Reserve via WhatsApp"));
      button?.click();
    });
    await sleep(300);
    Object.assign(report.booking, await page.evaluate(() => ({
      path: location.pathname,
      distanceVisible: document.body.textContent.includes("120 km"),
      durationVisible: document.body.textContent.includes("2 h"),
      confirmationOpen: Boolean(document.querySelector('[role="dialog"]')),
      bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    })));
  }
  await checkpoint("booking-complete");
  const admin = await createPage(390);
  const adminRequests = [];
  admin.on("request", (request) => adminRequests.push(request.url()));
  await goto(admin, "/admin");
  await admin.waitForSelector('input[type="email"]', { timeout: 10000 });
  report.security.admin = await admin.evaluate(() => ({
    hasSecureLogin: document.body.textContent.includes("Supabase Auth"),
    hasLegacyUsername: Boolean(document.querySelector('input[type="text"]')),
    hasPassword: Boolean(document.querySelector('input[type="password"]')),
  }));
  report.security.unauthenticatedReservationRequest = adminRequests.some((url) => url.includes("/rest/v1/reservations"));
  const adminShot = "/tmp/afsahi-admin-390.png";
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    await admin.screenshot({ path: adminShot, fullPage: true });
  }
  report.screenshots.push(adminShot);
  await checkpoint("admin-complete");
  const reduced = await createPage(390, true);
  await goto(reduced);
  await reduced.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.55));
  await sleep(250);
  report.reducedMotion = await reduced.evaluate(() => ({
    preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
    smoothScrollDisabled: getComputedStyle(document.documentElement).scrollBehavior !== "smooth",
    runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
    visibleHeroLines: [...document.querySelectorAll("[data-hero-line]")].every((line) => getComputedStyle(line).visibility !== "hidden"),
  }));
  await checkpoint("reduced-motion-complete");
  if (process.env.RUN_PERF === "1") {
    const perf = await createPage(1440);
    await perf.evaluateOnNewDocument(() => {
      window.__perf = { cls: 0, lcp: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__perf.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.__perf.lcp = entries.at(-1)?.startTime || 0;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await goto(perf);
    await sleep(120);
    report.performance = await perf.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const paint = Object.fromEntries(performance.getEntriesByType("paint").map((entry) => [entry.name, Math.round(entry.startTime)]));
      const resources = performance.getEntriesByType("resource");
      return {
        domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
        loadMs: Math.round(navigation.loadEventEnd),
        firstContentfulPaintMs: paint["first-contentful-paint"] || null,
        lcpMs: Math.round(window.__perf.lcp || 0),
        cls: Number(window.__perf.cls.toFixed(4)),
        transferredKb: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024),
        jsTransferredKb: Math.round(resources.filter((entry) => entry.name.includes(".js")).reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024),
      };
    });
    await checkpoint("performance-complete");
  } else {
    report.performance = { skipped: true, note: "Run with RUN_PERF=1 for local paint timings." };
    await checkpoint("validation-complete");
  }
} finally {
  browser.process()?.kill("SIGTERM");
}

const failures = [
  ...report.responsive.filter((item) => item.bodyOverflow).map((item) => `horizontal overflow at ${item.width}px`),
  ...report.pageErrors.map((item) => `page error: ${item.text}`),
  ...(report.security.homeLoadedAdminCode ? ["admin code loaded on public homepage"] : []),
  ...(report.security.homeContactedSupabase ? ["homepage contacted Supabase"] : []),
  ...(report.security.unauthenticatedReservationRequest ? ["unauthenticated admin requested reservations"] : []),
  ...(!report.navigation.anchor?.aligned ? ["anchor did not account for header offset"] : []),
  ...(!report.booking.confirmationOpen ? ["booking confirmation flow did not open"] : []),
  ...(!report.reducedMotion.visibleHeroLines ? ["reduced-motion hero content hidden"] : []),
];

const serialized = JSON.stringify({ ...report, failures }, null, 2);
await writeFile("/tmp/afsahi-ui-report.json", serialized);
console.log(serialized);
process.exit(failures.length ? 1 : 0);
