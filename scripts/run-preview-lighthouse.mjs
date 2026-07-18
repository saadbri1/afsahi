import { readFile, writeFile } from "node:fs/promises";

const target = process.env.TEST_URL;
const outputDir = process.env.OUTPUT_DIR;
const cookieFile = process.env.VERCEL_COOKIE_FILE || "/tmp/afsahi-vercel-preview.cookies";
const toolsDir = process.env.AUDIT_TOOLS_DIR || "/tmp/afsahi-audit-tools";
const auditMode = process.env.AUDIT_MODE || "both";

if (!target || !outputDir) {
  throw new Error("TEST_URL and OUTPUT_DIR are required.");
}

const lighthouseModule = await import(`${toolsDir}/node_modules/lighthouse/core/index.js`);
const { default: lighthouse, generateReport, desktopConfig } = lighthouseModule;
const { launch } = await import(`${toolsDir}/node_modules/chrome-launcher/dist/index.js`);

function cookieHeader(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    if (!line || (line.startsWith("#") && !line.startsWith("#HttpOnly_"))) return [];
    const fields = line.split("\t");
    return fields.length >= 7 ? [`${fields[5]}=${fields[6]}`] : [];
  }).join("; ");
}

const cookie = cookieHeader(await readFile(cookieFile, "utf8"));
if (!cookie.includes("_vercel_jwt=")) throw new Error("The temporary Vercel Preview cookie is missing.");

const chrome = await launch({
  chromePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
});

const categories = ["performance", "accessibility", "best-practices", "seo"];

function summarize(lhr) {
  const score = (category) => Math.round((lhr.categories[category]?.score || 0) * 100);
  const numeric = (audit) => lhr.audits[audit]?.numericValue;
  return {
    scores: {
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
    },
    metrics: {
      firstContentfulPaintMs: Math.round(numeric("first-contentful-paint") || 0),
      largestContentfulPaintMs: Math.round(numeric("largest-contentful-paint") || 0),
      totalBlockingTimeMs: Math.round(numeric("total-blocking-time") || 0),
      cumulativeLayoutShift: Number((numeric("cumulative-layout-shift") || 0).toFixed(4)),
      speedIndexMs: Math.round(numeric("speed-index") || 0),
    },
    finalUrl: lhr.finalDisplayedUrl,
    fetchTime: lhr.fetchTime,
    lighthouseVersion: lhr.lighthouseVersion,
  };
}

async function runAudit(name, config) {
  const result = await lighthouse(target, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: categories,
    extraHeaders: { Cookie: cookie },
  }, config);
  if (!result) throw new Error(`Lighthouse returned no ${name} result.`);
  await writeFile(`${outputDir}/afsahi-lighthouse-${name}.json`, JSON.stringify(result.lhr, null, 2));
  await writeFile(`${outputDir}/afsahi-lighthouse-${name}.html`, generateReport(result.lhr, "html"));
  return summarize(result.lhr);
}

try {
  const mobile = auditMode === "desktop" ? null : await runAudit("mobile");
  const desktop = auditMode === "mobile" ? null : await runAudit("desktop", desktopConfig);
  const summary = { target, mobile, desktop };
  await writeFile(`${outputDir}/afsahi-lighthouse-summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await chrome.kill();
}
