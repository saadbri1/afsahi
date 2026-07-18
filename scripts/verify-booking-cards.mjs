// Booking-flow vehicle card verification across breakpoints.
// Drives the real hero form -> /booking, then measures card geometry, price/
// capacity visibility, overflow, WhatsApp overlap and route-chip behaviour.
// Usage: TEST_URL=http://127.0.0.1:4173 node scripts/verify-booking-cards.mjs [label]
import puppeteer from "puppeteer-core";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:4173";
const label = process.argv[2] || "after";
const widths = [430, 390, 375, 360, 768, 1024, 1440];
const shotWidths = new Set([390, 768, 1440]);
const ACTIVE_FLEET = 5; // src/data/bookingPricing.js VEHICLES (active only)

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const report = { label, widths: [], consoleErrors: [], pageErrors: [], failures: [] };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function openBooking(width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1 });
  page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push({ width, text: m.text() }); });
  page.on("pageerror", (e) => report.pageErrors.push({ width, text: e.message }));
  await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });

  // Fill hero form with a real route so prices resolve.
  await page.evaluate(() => {
    const set = (el, v) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      s.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const combos = document.querySelectorAll('form#book input[role="combobox"]');
    set(combos[0], "marrakech");
    set(combos[1], "agadir");
    set(document.querySelector('form#book input[type="date"]'), "2026-09-12");
    set(document.querySelector('form#book input[type="time"]'), "10:30");
  });
  await pause(250);
  await page.evaluate(() => document.querySelector('form#book button[type="submit"]').click());
  // wait for options page + a resolved price
  await page.waitForFunction(() => /MAD/.test(document.body.innerText) && document.querySelectorAll("button h4").length > 0, { timeout: 45000 });
  await pause(1200); // let route/price settle
  return page;
}

try {
  for (const width of widths) {
    const page = await openBooking(width);
    const data = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("button")].filter((b) => b.querySelector("h4"));
      const vp = { w: innerWidth, h: innerHeight };
      const first = cards[0]?.getBoundingClientRect();
      const second = cards[1]?.getBoundingClientRect();
      const wa = document.querySelector('a[aria-label="Contact AFSAHI on WhatsApp"]');
      const waRect = wa?.getBoundingClientRect();
      const overlaps = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      // A fixed FAB always overlaps the full-width card COLUMN on mobile; what
      // actually matters is whether it covers price / capacity / selected badge.
      const critical = [];
      cards.forEach((c) => {
        c.querySelectorAll("div, span").forEach((el) => {
          const t = el.textContent || "";
          if (/MAD|selected/i.test(t) && el.children.length === 0) critical.push(el);
        });
      });
      const waCoversCritical = critical.some((el) => overlaps(el.getBoundingClientRect(), waRect));
      const cardText = cards[0]?.innerText.replace(/\s+/g, " ") || "";
      // route chips
      const chips = [...document.querySelectorAll(".truncate")].slice(0, 4).map((c) => ({
        text: c.innerText.trim().slice(0, 40),
        scrollW: c.scrollWidth,
        clientW: c.clientWidth,
      }));
      const recapBlock = document.querySelector("h1")?.parentElement?.getBoundingClientRect();
      return {
        cardCount: cards.length,
        cardHeight: first ? Math.round(first.height) : null,
        cardWidth: first ? Math.round(first.width) : null,
        firstCardTop: first ? Math.round(first.top) : null,
        secondCardVisibleInViewport: second ? second.top < vp.h : false,
        nextCardPeek: second && first ? Math.round(vp.h - second.top) : null,
        priceInFirstCard: /MAD/.test(cardText),
        capacityInFirstCard: /\d/.test(cardText),
        firstCardText: cardText.slice(0, 120),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        waCoversCritical,
        waSize: waRect ? Math.round(waRect.width) : null,
        chips,
        recapHeight: recapBlock ? Math.round(recapBlock.height) : null,
        imgRendered: (() => {
          const img = cards[0]?.querySelector("img");
          if (!img) return null;
          const r = img.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height), complete: img.complete && img.naturalWidth > 0 };
        })(),
      };
    });

    // carousel behaviour (mobile only) — snap, peek, reachability, ordering
    const carousel = await page.evaluate(async (w) => {
      const track = document.querySelector('[class*="snap-x"]');
      if (!track) return null;
      const style = getComputedStyle(track);
      const isCarousel = style.overflowX === "auto" || style.overflowX === "scroll";
      const items = [...track.children];
      const first = items[0]?.getBoundingClientRect();
      const second = items[1]?.getBoundingClientRect();
      const vw = innerWidth;
      // fraction of the 2nd card visible at rest = the "peek"
      const peekPx = second ? Math.max(0, vw - second.left) : 0;
      const peekPct = second ? peekPx / second.width : 0;
      // can we reach the last card?
      const maxScroll = track.scrollWidth - track.clientWidth;
      track.scrollLeft = maxScroll;
      await new Promise((r) => setTimeout(r, 350));
      const lastVisible = items[items.length - 1].getBoundingClientRect().right <= vw + 2;
      track.scrollLeft = 0;
      await new Promise((r) => setTimeout(r, 350));
      // vertical page scroll must still work
      const beforeY = scrollY; window.scrollBy(0, 200);
      await new Promise((r) => setTimeout(r, 200));
      const verticalScrollWorks = scrollY > beforeY; window.scrollTo(0, beforeY);
      // mobile order: carousel -> summary -> map
      const summary = [...document.querySelectorAll("h3")].find((h) => /Booking summary/i.test(h.textContent));
      const map = document.querySelector(".leaflet-container");
      const trackTop = track.getBoundingClientRect().top + scrollY;
      const sumTop = summary ? summary.getBoundingClientRect().top + scrollY : null;
      const mapTop = map ? map.getBoundingClientRect().top + scrollY : null;
      const indicator = document.querySelector('[aria-hidden="true"] span.bg-line, [aria-hidden="true"] .bg-line');
      return {
        isCarousel,
        snapType: style.scrollSnapType,
        itemCount: items.length,
        cardVw: first ? Math.round((first.width / vw) * 100) : null,
        peekPct: Math.round(peekPct * 100),
        lastCardReachable: lastVisible,
        verticalScrollWorks,
        trackScrollable: maxScroll > 0,
        orderOk: sumTop != null && mapTop != null ? trackTop < sumTop && sumTop < mapTop : null,
        hasIndicator: Boolean(indicator),
      };
    }, width);

    // selection + keyboard accessibility
    const interaction = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("button")].filter((b) => b.querySelector("h4"));
      const target = cards[2];
      const before = target.getBoundingClientRect().height;
      target.click();
      return { clicked: true, heightBefore: Math.round(before) };
    });
    await pause(500);
    const afterSelect = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("button")].filter((b) => b.querySelector("h4"));
      const target = cards[2];
      return {
        ariaPressed: target.getAttribute("aria-pressed"),
        hasBadge: /selected/i.test(target.innerText),
        heightAfter: Math.round(target.getBoundingClientRect().height),
        summaryVehicle: (document.body.innerText.match(/Mercedes [A-Za-z-]+|Skoda [A-Za-z]+|Ford [A-Za-z]+/g) || []).slice(-1)[0],
      };
    });
    report.widths.push({ width, ...data, ...afterSelect, carousel, layoutJump: Math.abs(afterSelect.heightAfter - interaction.heightBefore) });

    if (shotWidths.has(width)) {
      // scroll to the card list so the shot shows the cards
      await page.evaluate(() => {
        const h3 = [...document.querySelectorAll("h3")].find((x) => x.textContent.includes("Choose your experience"));
        if (h3) window.scrollTo(0, window.scrollY + h3.getBoundingClientRect().top - 70);
      });
      await pause(600);
      await page.screenshot({ path: `/tmp/afsahi-cards-${label}-${width}.png`, captureBeyondViewport: false });
    }
    await page.close();
    await pause(1500); // pace Nominatim so the harness doesn't rate-limit itself
  }

  // ── Long geocoded label: select autocomplete suggestions so the stored label
  // is a full administrative address, then assert the mobile chip is shortened.
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
    const pick = async (index, query) => {
      await page.evaluate((i, q) => {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        const el = document.querySelectorAll('form#book input[role="combobox"]')[i];
        s.call(el, q);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, index, query);
      await page.waitForFunction(() => document.querySelector('form#book ul[role="listbox"] li'), { timeout: 15000 }).catch(() => {});
      await pause(400);
      // the list commits on mousedown (not click), so dispatch the real event
      await page.evaluate(() => {
        const li = document.querySelector('form#book ul[role="listbox"] li');
        li?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      });
      await pause(350);
    };
    await pick(0, "casablanca");
    await pick(1, "rabat");
    await page.evaluate(() => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const d = document.querySelector('form#book input[type="date"]');
      const t = document.querySelector('form#book input[type="time"]');
      s.call(d, "2026-09-12"); d.dispatchEvent(new Event("input", { bubbles: true }));
      s.call(t, "10:30"); t.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await pause(200);
    await page.evaluate(() => document.querySelector('form#book button[type="submit"]').click());
    await page.waitForFunction(() => document.querySelectorAll("button h4").length > 0, { timeout: 45000 });
    await pause(900);
    report.longLabel = await page.evaluate(() => {
      const chips = [...document.querySelectorAll('[title]')].filter((c) => c.className.includes("rounded-full") && c.className.includes("border-line"));
      const recap = document.querySelector("h1")?.parentElement;
      return {
        chips: chips.slice(0, 2).map((c) => {
          const mobileSpan = c.querySelector("span.truncate.lg\\:hidden") || c.querySelectorAll("span")[0];
          return {
            title: c.getAttribute("title"),
            titleHasComma: (c.getAttribute("title") || "").includes(","),
            mobileText: mobileSpan?.textContent?.trim(),
            mobileHasComma: (mobileSpan?.textContent || "").includes(","),
            renderedWidth: Math.round(c.getBoundingClientRect().width),
          };
        }),
        recapHeight: recap ? Math.round(recap.getBoundingClientRect().height) : null,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    await page.close();
  }
  if (report.longLabel) {
    // guard: if no chip carries a multi-part address the test proved nothing
    if (!report.longLabel.chips.some((c) => c.titleHasComma)) {
      report.failures.push("Long-label path not exercised (no multi-part address stored)");
    }
    if (report.longLabel.horizontalOverflow) report.failures.push("Long label caused horizontal overflow");
    if (report.longLabel.chips.some((c) => c.mobileHasComma)) report.failures.push("Mobile chip not shortened to primary label");
    if (report.longLabel.recapHeight > 300) report.failures.push(`Route recap too tall with long labels: ${report.longLabel.recapHeight}px`);
  }

  for (const w of report.widths) {
    if (w.horizontalOverflow) report.failures.push(`Horizontal overflow at ${w.width}px`);
    if (!w.priceInFirstCard) report.failures.push(`Price not visible in card at ${w.width}px`);
    if (w.waCoversCritical) report.failures.push(`WhatsApp covers price/badge at ${w.width}px`);
    if (w.width < 768 && w.cardHeight > 460) report.failures.push(`Card too tall at ${w.width}px: ${w.cardHeight}px`);
    if (w.width < 768) {
      const c = w.carousel;
      if (!c?.isCarousel) report.failures.push(`Not a scroll carousel at ${w.width}px`);
      else {
        if (!/mandatory/.test(c.snapType)) report.failures.push(`scroll-snap missing at ${w.width}px: ${c.snapType}`);
        if (c.cardVw < 80 || c.cardVw > 90) report.failures.push(`Card width ${c.cardVw}vw out of range at ${w.width}px`);
        if (c.peekPct < 10 || c.peekPct > 16) report.failures.push(`Next-card peek ${c.peekPct}% out of range at ${w.width}px`);
        if (!c.lastCardReachable) report.failures.push(`Last vehicle unreachable at ${w.width}px`);
        if (!c.verticalScrollWorks) report.failures.push(`Vertical page scroll broken at ${w.width}px`);
        if (c.orderOk === false) report.failures.push(`Mobile order wrong (cards→summary→map) at ${w.width}px`);
        if (!c.hasIndicator) report.failures.push(`Carousel indicator missing at ${w.width}px`);
      }
    }
    if (w.width >= 768 && w.carousel?.isCarousel) report.failures.push(`Carousel should be a grid at ${w.width}px`);
    // active fleet size (paused vehicles are intentionally not offered)
    if (w.cardCount !== ACTIVE_FLEET) report.failures.push(`Expected ${ACTIVE_FLEET} vehicles, saw ${w.cardCount} at ${w.width}px`);
    if (w.ariaPressed !== "true" || !w.hasBadge) report.failures.push(`Selection state failed at ${w.width}px`);
    if (w.layoutJump > 2) report.failures.push(`Layout jump on select at ${w.width}px: ${w.layoutJump}px`);
    if (w.imgRendered && !w.imgRendered.complete) report.failures.push(`Vehicle image not loaded at ${w.width}px`);
  }
  // Nominatim rate-limit noise from the harness itself is not an app error.
  const appErrors = report.consoleErrors.filter((e) => !/nominatim|ERR_FAILED|Failed to load resource/i.test(e.text));
  report.nominatimNoise = report.consoleErrors.length - appErrors.length;
  report.appConsoleErrors = appErrors;
  if (appErrors.length || report.pageErrors.length) report.failures.push("Browser errors detected");

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGTERM");
}
