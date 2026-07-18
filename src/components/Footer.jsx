/* Premium 5-column footer — noir background, cream text, no app badges */
import { Phone, MessageCircle, Mail, Instagram, Facebook } from "lucide-react";
import Logo, { Wordmark } from "./Logo.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import {
  PHONE_DISPLAY, PHONE_TEL, EMAIL, INSTAGRAM_URL, FACEBOOK_URL, CITY,
} from "../config/contact.js";
import { buildWhatsAppUrl, SIMPLE_WHATSAPP_MESSAGE } from "../lib/whatsapp.js";

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;
  const waHref = buildWhatsAppUrl(SIMPLE_WHATSAPP_MESSAGE);

  const socials = [
    { label: "Instagram", href: INSTAGRAM_URL, icon: <Instagram size={15} /> },
    { label: "Facebook", href: FACEBOOK_URL, icon: <Facebook size={15} /> },
    { label: "WhatsApp", href: waHref, icon: <MessageCircle size={15} /> },
  ];
  const serviceLinks = f.serviceLinks.map((label, index) => ({ label, href: index < 2 ? "#services" : "#cities" }));
  const cityLinks = f.cityLinks.map((label) => ({ label, href: "#cities" }));
  const companyLinks = [
    { label: f.companyLinks[0], href: "#why-afsahi" },
    { label: f.companyLinks[1], href: "#reviews" },
    { label: f.companyLinks[2], href: "#faq" },
    { label: f.companyLinks[3], href: `mailto:${EMAIL}?subject=AFSAHI careers` },
  ];

  return (
    <footer className="bg-noir pt-20">
      <div className="wrap">
        {/* brand + 4 link columns */}
        <div className="grid gap-12 border-b border-champ/20 pb-16 md:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <div className="mb-5 flex items-center gap-3 text-cream">
              <Logo size={36} />
              <Wordmark />
            </div>
            <p className="max-w-[22rem] text-[0.88rem] leading-[1.75] text-cream/55">{f.blurb}</p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  target="_blank" rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full border border-cream/15 text-cream/55 transition-colors duration-300 hover:border-champ hover:text-champ">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <FooterCol title={f.services}>
            {serviceLinks.map((link) => <FLink key={link.label} href={link.href}>{link.label}</FLink>)}
          </FooterCol>
          <FooterCol title={f.cities}>
            {cityLinks.map((link) => <FLink key={link.label} href={link.href}>{link.label}</FLink>)}
          </FooterCol>
          <FooterCol title={f.company}>
            {companyLinks.map((link) => <FLink key={link.label} href={link.href}>{link.label}</FLink>)}
          </FooterCol>
          <FooterCol title={f.contact}>
            <ContactLink href={`tel:${PHONE_TEL}`}><Phone size={13} /> {PHONE_DISPLAY}</ContactLink>
            <ContactLink href={waHref} external><MessageCircle size={13} /> WhatsApp</ContactLink>
            <ContactLink href={`mailto:${EMAIL}`}><Mail size={13} /> {EMAIL}</ContactLink>
            <p className="mt-5 text-[0.76rem] text-cream/35">{CITY}</p>
          </FooterCol>
        </div>

        {/* payment badges + legal */}
        <div className="flex flex-col items-start justify-between gap-5 py-8 md:flex-row md:items-center">
          <p className="text-[0.74rem] tracking-wide text-cream/35">
            © {new Date().getFullYear()} AFSAHI Luxury Transport · {f.rights}
          </p>
          <div className="flex items-center gap-2">
            {["VISA", "MC", "AMEX", "Cash"].map((p) => (
              <span key={p} className="rounded border border-cream/12 px-2.5 py-1 text-[0.6rem] font-medium tracking-[0.08em] text-cream/35">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="mb-5 text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-champ">{title}</h4>
      {children}
    </div>
  );
}

function FLink({ children, href }) {
  return (
    <a href={href} className="mb-2.5 block text-[0.88rem] text-cream/55 transition-colors duration-300 hover:text-cream">
      {children}
    </a>
  );
}

function ContactLink({ href, external, children }) {
  return (
    <a href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="mb-2.5 flex items-center gap-2 text-[0.88rem] text-cream/55 transition-colors duration-300 hover:text-cream">
      {children}
    </a>
  );
}
