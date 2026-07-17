/* =================================================================
   CENTRALISED IMAGE MAP
   -----------------------------------------------------------------
   Every image in the site is referenced from here, so swapping the
   art direction is a one-file change.

   CURRENTLY: on-brand cinematic renders already produced for AFSAHI
   (dark/gold, zero broken-image risk), served by Vite from /public.

   TO SWAP to Higgsfield once credits are topped up: regenerate with
   the prompts in data/higgsfieldPrompts.js and drop the files into
   /public/images using the SAME filenames — nothing else changes.

   Unsplash fallbacks (real working URLs) are listed alongside each
   key if you prefer stock photography instead.
   ================================================================= */

export const IMAGES = {
  // hero — REAL photo: chauffeur with umbrella opening S-Class door for client
  // (Pexels · Pavel Danilyuk)
  hero: "/images/optimized/hero-1920.webp",

  // services — REAL photos (Pexels · Pavel Danilyuk)
  serviceAirport: "/images/optimized/services/airport-transfers.webp",
  serviceHourly: "/images/optimized/services/by-the-hour.webp",

  // section photos — REAL (Pexels · Pavel Danilyuk)
  sectionOnboard: "/images/optimized/sections/onboard-detail.webp",
  sectionCta: "/images/optimized/sections/cta-ready.webp",

  // experience — premium leather interior, ambient gold light
  interior: "/images/optimized/interior.webp",
  // unsplash alt: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=2000&q=80"

  // fleet — numbered studio shots in /images/cars/ (drop replacements here as cars/N.png)
  fleetSedan:       "/images/optimized/cars/1.webp",
  fleetFirst:       "/images/optimized/cars/3.webp",
  fleetSuv:         "/images/optimized/cars/4.webp",
  fleetPremium:     "/images/optimized/cars/6.webp",
  fleetEconomy:     "/images/optimized/cars/7.webp",
  fleetVan:         "/images/optimized/cars/2.webp",
  fleetVanExec:     "/images/optimized/cars/5.webp",
  fleetMinibus:     "/images/optimized/cars/8.webp",
  fleetShuttle:     "/images/optimized/cars/9.webp",
};
