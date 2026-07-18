// Vehicle capacity + pricing verification.
// Drives the real booking flow, then for each (passengers, bags) case checks
// which vehicles are selectable, that incompatible ones are disabled with a
// reason, that prices equal round(distanceKm × pricePerKm), and that the
// summary + reservation payload carry the customer's counts.
// Usage: TEST_URL=http://127.0.0.1:4173 node scripts/verify-booking-capacity.mjs
import puppeteer from "puppeteer-core";

const baseUrl = process.env.TEST_URL || "http://127.0.0.1:4173";

// Must mirror src/data/bookingPricing.js (active fleet)
const FLEET = [
  { name: "Mercedes E-Class", maxPassengers: 3, maxBags: 2, pricePerKm: 11 },
  { name: "Skoda Superb", maxPassengers: 3, maxBags: 3, pricePerKm: 8.5 },
  { name: "Skoda Kodiaq", maxPassengers: 4, maxBags: 3, pricePerKm: 8.5 },
  { name: "Mercedes Vito", maxPassengers: 7, maxBags: 6, pricePerKm: 11 },
  { name: "Minibus", maxPassengers: 19, maxBags: 20, pricePerKm: 20 },
];
const CASES = [
  { passengers: 1, bags: 0 },
  { passengers: 3, bags: 2 },
  { passengers: 5, bags: 5 },
  { passengers: 7, bags: 7 },
  { passengers: 19, bags: 20 },
];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const report = { distanceKm: null, cases: [], pricing: [], payload: null, consoleErrors: [], pageErrors: [], failures: [] };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => report.pageErrors.push(e.message));

  // capture the reservation payload instead of hitting Supabase
  await page.evaluateOnNewDocument(() => {
    window.__payloads = [];
    const origFetch = window.fetch;
    window.fetch = function (url, opts) {
      try {
        if (String(url).includes("/rest/v1/reservations") && opts?.method === "POST") {
          window.__payloads.push(JSON.parse(opts.body));
          return Promise.resolve(new Response("[]", { status: 201, headers: { "Content-Type": "application/json" } }));
        }
      } catch { /* fall through */ }
      return origFetch.apply(this, arguments);
    };
    // Return a truthy stub: returning null makes the app fall back to
    // location.assign(whatsappUrl), which would navigate the page away.
    window.open = () => ({ closed: false, focus() {}, close() {} });
  });

  await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => {
    const set = (el, v) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      s.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const c = document.querySelectorAll('form#book input[role="combobox"]');
    set(c[0], "marrakech"); set(c[1], "agadir");
    set(document.querySelector('form#book input[type="date"]'), "2026-09-12");
    set(document.querySelector('form#book input[type="time"]'), "10:30");
  });
  await pause(250);
  await page.evaluate(() => document.querySelector('form#book button[type="submit"]').click());
  await page.waitForFunction(() => /MAD/.test(document.body.innerText), { timeout: 45000 });
  await pause(1500);

  report.distanceKm = await page.evaluate(() => {
    const m = document.body.innerText.match(/([\d.]+)\s*km/);
    return m ? Number(m[1]) : null;
  });

  const setCount = async (id, value) => {
    await page.evaluate((sel, v) => {
      const el = document.getElementById(sel);
      const s = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
      s.call(el, String(v));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, id, value);
    await pause(450);
  };

  for (const c of CASES) {
    await setCount("passenger-count", c.passengers);
    await setCount("bag-count", c.bags);
    const state = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("button")].filter((b) => b.querySelector("h4"));
      return {
        cards: cards.map((b) => ({
          name: b.querySelector("h4").textContent.trim(),
          disabled: b.disabled,
          reason: /Not suitable/.test(b.innerText) ? b.innerText.match(/Not suitable[^\n]*/)[0] : null,
          selected: b.getAttribute("aria-pressed") === "true",
        })),
        // read the summary rows from the DOM — a body-text regex would hit the
        // <select>, whose innerText lists every option (always "1"/"0")
        ...(() => {
          const head = [...document.querySelectorAll("h3")].find((h) => /Booking summary/i.test(h.textContent));
          const box = head?.parentElement;
          const read = (label) => {
            if (!box) return null;
            const row = [...box.querySelectorAll("div")].find(
              (d) => d.children.length === 2 && d.children[0].textContent.trim().toLowerCase() === label
            );
            return row ? row.children[1].textContent.trim() : null;
          };
          return { summaryPassengers: read("passengers"), summaryBags: read("bags") };
        })(),
        noneMessage: /No vehicle in the fleet fits/.test(document.body.innerText),
      };
    });

    const expected = FLEET.filter((f) => f.maxPassengers >= c.passengers && f.maxBags >= c.bags).map((f) => f.name);
    const enabled = state.cards.filter((x) => !x.disabled).map((x) => x.name);
    const disabledNoReason = state.cards.filter((x) => x.disabled && !x.reason).map((x) => x.name);
    const selectedCard = state.cards.find((x) => x.selected);

    report.cases.push({ ...c, expectedCompatible: expected, enabled, selected: selectedCard?.name ?? null, noneMessage: state.noneMessage, summaryPassengers: state.summaryPassengers, summaryBags: state.summaryBags });

    if (JSON.stringify([...enabled].sort()) !== JSON.stringify([...expected].sort())) {
      report.failures.push(`${c.passengers}p/${c.bags}b: selectable ${JSON.stringify(enabled)} != expected ${JSON.stringify(expected)}`);
    }
    if (disabledNoReason.length) report.failures.push(`${c.passengers}p/${c.bags}b: disabled without reason: ${disabledNoReason}`);
    if (expected.length && !selectedCard) report.failures.push(`${c.passengers}p/${c.bags}b: nothing selected though ${expected.length} fit`);
    if (selectedCard && !expected.includes(selectedCard.name)) report.failures.push(`${c.passengers}p/${c.bags}b: selected incompatible ${selectedCard.name}`);
    if (String(state.summaryPassengers) !== String(c.passengers)) report.failures.push(`${c.passengers}p/${c.bags}b: summary passengers=${state.summaryPassengers}`);
    if (String(state.summaryBags) !== String(c.bags)) report.failures.push(`${c.passengers}p/${c.bags}b: summary bags=${state.summaryBags}`);
  }

  // over-capacity: 19 passengers is the max; ask for more than any vehicle
  await setCount("passenger-count", 19);
  await setCount("bag-count", 20);

  // ── pricing: price must equal round(distance × pricePerKm)
  await setCount("passenger-count", 1);
  await setCount("bag-count", 0);
  const prices = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("button")].filter((b) => b.querySelector("h4"));
    return cards.map((b) => ({
      name: b.querySelector("h4").textContent.trim(),
      mad: Number((b.innerText.match(/([\d,]+)\s*MAD/) || [])[1]?.replace(/,/g, "")),
    }));
  });
  for (const p of prices) {
    const f = FLEET.find((x) => x.name === p.name);
    if (!f) continue;
    const expected = Math.round(report.distanceKm * f.pricePerKm);
    report.pricing.push({ name: p.name, shown: p.mad, expected });
    if (Math.abs(p.mad - expected) > 1) report.failures.push(`Price ${p.name}: ${p.mad} != ${expected}`);
  }

  // ── reservation payload carries the customer's counts + final price
  await setCount("passenger-count", 5);
  await setCount("bag-count", 5);
  await page.evaluate(() => {
    const set = (el, v) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      s.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set(document.querySelector('input[placeholder="Full name"]'), "Capacity Test");
    set(document.querySelector('input[placeholder="Phone / WhatsApp number"]'), "+212611223344");
    set(document.querySelector('input[placeholder="Email address"]'), "cap@test.ma");
  });
  await pause(400);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Reserve via WhatsApp"))?.click());
  await pause(600);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Confirm reservation")?.click());
  await pause(2000);
  report.payload = await page.evaluate(() => window.__payloads?.[0] ?? null);

  const p = report.payload;
  if (!p) report.failures.push("No reservation payload captured");
  else {
    if (p.passengers !== 5) report.failures.push(`payload.passengers=${p.passengers} (expected 5)`);
    if (p.luggage !== 5) report.failures.push(`payload.luggage=${p.luggage} (expected 5)`);
    if (!p.vehicle) report.failures.push("payload.vehicle missing");
    if (!p.price_mad) report.failures.push("payload.price_mad missing");
    if (!/Passengers: 5/.test(p.message || "")) report.failures.push("WhatsApp message missing 'Passengers: 5'");
    if (!/Luggage: 5/.test(p.message || "")) report.failures.push("WhatsApp message missing 'Luggage: 5'");
    const f = FLEET.find((x) => x.name === p.vehicle);
    if (f && Math.abs(p.price_mad - Math.round(report.distanceKm * f.pricePerKm)) > 1) {
      report.failures.push(`payload price ${p.price_mad} != round(${report.distanceKm}×${f.pricePerKm})`);
    }
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (overflow) report.failures.push("Horizontal overflow at 1440px");
  const appErrors = report.consoleErrors.filter((t) => !/nominatim|ERR_FAILED|Failed to load resource/i.test(t));
  report.appConsoleErrors = appErrors;
  if (appErrors.length || report.pageErrors.length) report.failures.push("Browser errors detected");

  await page.close();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGTERM");
}
