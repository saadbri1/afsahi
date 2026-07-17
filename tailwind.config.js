/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // LOCKED TOKENS — light / airy luxury (Blacklane-true) × Afsahi champagne
        paper: "#FCFAF5", // page background (warm ivory)
        sand: "#F2ECDF", // soft band
        "sand-2": "#EAE2D2", // deeper band
        surface: "#FFFFFF", // cards
        ink: "#15120C", // headings / strong text (espresso)
        body: "#574F45", // body copy
        muted: "#8B8275", // muted text
        line: "#E7DECC", // hairline border
        champ: "#A9823F", // champagne accent (deep enough for light bg)
        "champ-lt": "#C9A86A", // light champagne
        "champ-dk": "#7E6024", // champagne for small text/links on light (AA)
        noir: "#16130D", // rare dark band background
        cream: "#F6F2EA", // text on dark bands
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Helvetica Neue"', "Arial", "system-ui", "sans-serif"],
        serif: ['"Avenir Next"', '"Helvetica Neue"', "Arial", "system-ui", "sans-serif"],
      },
      letterSpacing: { luxe: "0.26em" },
      transitionTimingFunction: { luxe: "cubic-bezier(.16,1,.3,1)" },
    },
  },
  plugins: [],
};
