import { createContext, useContext, useState, useCallback } from "react";
import { I18N } from "../data/i18n.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");
  const toggle = useCallback(() => {
    setLang((l) => {
      const next = l === "en" ? "fr" : "en";
      document.documentElement.lang = next;
      return next;
    });
  }, []);
  const t = I18N[lang];
  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
