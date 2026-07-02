import { useState, lazy, Suspense } from "react";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { BookingProvider } from "./context/BookingContext.jsx";
import { useLenis } from "./hooks/useLenis.js";

import CustomCursor from "./components/CustomCursor.jsx";
import FloatingWhatsApp from "./components/FloatingWhatsApp.jsx";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import ServiceCards from "./components/ServiceCards.jsx";
import ExperienceSection from "./components/ExperienceSection.jsx";
import WhyAfsahi from "./components/WhyAfsahi.jsx";
import BusinessSection from "./components/BusinessSection.jsx";
import ShowcaseSection from "./components/ShowcaseSection.jsx";
import ComfortSection from "./components/ComfortSection.jsx";
import GlobalChauffeurMotion from "./components/GlobalChauffeurMotion.jsx";
import Fleet from "./components/Fleet.jsx";
import ServiceAreas from "./components/ServiceAreas.jsx";
import Reviews from "./components/Reviews.jsx";
import FAQ from "./components/FAQ.jsx";
import PartnersSection from "./components/PartnersSection.jsx";
import Chauffeurs from "./components/Chauffeurs.jsx";
import FinalCTA from "./components/FinalCTA.jsx";
import Footer from "./components/Footer.jsx";

// Blacklane-style booking system — lazy-loaded so the map bundle never blocks
// the homepage's first paint.
const BookingSystem = lazy(() => import("./pages/BookingSystem.jsx"));

// Owner dashboard at /admin — lazy so visitors never download admin code.
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));

function Homepage({ onSeePrices }) {
  useLenis();
  return (
    <>
      <Navbar onSeePrices={onSeePrices} />
      <main>
        {/* 1. Hero + booking bar */}
        <Hero onSeePrices={onSeePrices} />
        {/* 2. Service cards (airport + hourly) */}
        <ServiceCards />
        {/* 3. "Step in. Exhale." cinematic moment */}
        <ExperienceSection />
        {/* 4. "Expect more, notice less." feature grid */}
        <WhyAfsahi />
        {/* 5. "Made for the way you work." business split */}
        <BusinessSection />
        {/* 6. "Priced before you ride." booking showcase */}
        <ShowcaseSection onSeePrices={onSeePrices} />
        {/* 7. "Every detail, already handled." comfort/amenities */}
        <ComfortSection />
        {/* 7b. "Luxury Chauffeur Across Morocco" globe + orbit animation */}
        <GlobalChauffeurMotion onSeePrices={onSeePrices} />
        {/* 8. Fleet carousel */}
        <Fleet />
        {/* 9. City tile grid */}
        <ServiceAreas />
        {/* 10. Testimonials */}
        <Reviews />
        {/* 11. FAQ accordion */}
        <FAQ />
        {/* 12. Partner trust strip */}
        <PartnersSection />
        {/* 13. "Our Chauffeurs" — chauffeur showcase */}
        <Chauffeurs />
        {/* 14. Final CTA band (dark) */}
        <FinalCTA onSeePrices={onSeePrices} />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [showBooking, setShowBooking] = useState(false);

  // Owner dashboard — path-based (no router lib). Vercel rewrites every path to
  // index.html (see vercel.json), so /admin also works in production.
  if (window.location.pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-noir text-cream/60">Loading…</div>}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <LanguageProvider>
      <BookingProvider>
        <CustomCursor />
        {showBooking
          ? (
            <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-muted">Loading…</div>}>
              <BookingSystem onBack={() => setShowBooking(false)} />
            </Suspense>
          )
          : <Homepage onSeePrices={() => setShowBooking(true)} />
        }
        {/* Site-wide floating WhatsApp — visible on every view */}
        <FloatingWhatsApp />
      </BookingProvider>
    </LanguageProvider>
  );
}
