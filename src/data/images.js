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
  hero: "/images/hero/hero-real.jpg",

  // services — REAL photos (Pexels · Pavel Danilyuk)
  serviceAirport: "/images/services/airport-transfers-real.jpg", // executive arrival, hotel "Lounge"
  serviceHourly: "/images/services/by-the-hour-real.jpg",        // chauffeured client on the phone
  serviceCity: "/images/morocco-road.jpg",

  // section photos — REAL (Pexels · Pavel Danilyuk)
  sectionOnboard: "/images/sections/onboard-detail-real.jpg", // chauffeur opening the rear door handle (rain-flecked black sedan)
  sectionCta: "/images/sections/cta-ready-real.jpg",   // side-view S-Class at a modern hotel

  // experience — premium leather interior, ambient gold light
  interior: "/images/van-interior.jpg",
  // unsplash alt: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=2000&q=80"

  // fleet — numbered studio shots in /images/cars/ (drop replacements here as cars/N.png)
  fleetSedan:       "/images/cars/1.png",   // Business Class — Mercedes E-Class
  fleetFirst:       "/images/cars/3.png",   // First Class — Mercedes E-Class
  fleetSuv:         "/images/cars/4.png",   // Premium SUV — Skoda Kodiaq
  fleetPremium:     "/images/cars/6.png",   // Premium Sedan — Skoda Superb black
  fleetEconomy:     "/images/cars/7.png",   // Economy Sedan — Skoda Superb white
  fleetVan:         "/images/cars/2.png",   // Business Van — Mercedes V-Class
  fleetVanExec:     "/images/cars/5.png",   // Executive Van — Mercedes V-Class
  fleetMinibus:     "/images/cars/8.png",   // VIP Minibus — Mercedes Sprinter
  fleetShuttle:     "/images/cars/9.png",   // Premium Shuttle — Ford Tourneo Custom

  // destination tiles
  cityCasablanca: "/images/hero-sedan.jpg",
  cityMarrakech: "/images/morocco-road.jpg",
  cityTanger: "/images/chauffeur-door.jpg",
  cityRabat: "/images/meet-greet.jpg",
  cityAgadir: "/images/van-interior.jpg",
};
