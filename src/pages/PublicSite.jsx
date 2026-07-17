import { lazy, Suspense, useEffect } from "react";
import { LanguageProvider } from "../context/LanguageContext.jsx";
import { BookingProvider } from "../context/BookingContext.jsx";

import FloatingWhatsApp from "../components/FloatingWhatsApp.jsx";
import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import ServiceCards from "../components/ServiceCards.jsx";
import ExperienceSection from "../components/ExperienceSection.jsx";
import WhyAfsahi from "../components/WhyAfsahi.jsx";
import BusinessSection from "../components/BusinessSection.jsx";
import ShowcaseSection from "../components/ShowcaseSection.jsx";
import ComfortSection from "../components/ComfortSection.jsx";
import GlobalChauffeurMotion from "../components/GlobalChauffeurMotion.jsx";
import Fleet from "../components/Fleet.jsx";
import ServiceAreas from "../components/ServiceAreas.jsx";
import Reviews from "../components/Reviews.jsx";
import FAQ from "../components/FAQ.jsx";
import PartnersSection from "../components/PartnersSection.jsx";
import Chauffeurs from "../components/Chauffeurs.jsx";
import FinalCTA from "../components/FinalCTA.jsx";
import Footer from "../components/Footer.jsx";

const BookingSystem = lazy(() => import("./BookingSystem.jsx"));

function Homepage({ onSeePrices }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <Hero onSeePrices={onSeePrices} />
        <ServiceCards />
        <ExperienceSection />
        <WhyAfsahi />
        <BusinessSection />
        <ShowcaseSection onSeePrices={onSeePrices} />
        <ComfortSection />
        <GlobalChauffeurMotion onSeePrices={onSeePrices} />
        <Fleet />
        <ServiceAreas />
        <Reviews />
        <FAQ />
        <PartnersSection />
        <Chauffeurs />
        <FinalCTA onSeePrices={onSeePrices} />
      </main>
      <Footer />
    </>
  );
}

export default function PublicSite({ path, navigate }) {
  const booking = path === "/booking";

  useEffect(() => {
    document.documentElement.dataset.route = booking ? "booking" : "public";
    document.title = booking
      ? "Book a Private Chauffeur | AFSAHI Luxury Transport"
      : "AFSAHI Luxury Transport | Private Chauffeur in Morocco";
    return () => delete document.documentElement.dataset.route;
  }, [booking]);

  return (
    <LanguageProvider>
      <BookingProvider>
        {booking ? (
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-muted">Preparing your journey…</div>}>
            <BookingSystem onBack={() => navigate("/")} />
          </Suspense>
        ) : (
          <Homepage onSeePrices={() => navigate("/booking")} />
        )}
        <FloatingWhatsApp />
      </BookingProvider>
    </LanguageProvider>
  );
}
