import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // darkMode: 'class' → el toggle de ThemeToggle.tsx añade/quita la clase "dark" en <html>
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Marca principal ────────────────────────────────────────────
        teal: {
          DEFAULT: "#0D9488",
          light:   "#E6FBF8",
          dark:    "#0F766E",
        },
        purple: {
          DEFAULT: "#7E6BC4",
          light:   "#F0EEFF",
          dark:    "#5B48A8",
        },

        // ── Colores de tiendas ─────────────────────────────────────────
        "deal-red":     "#DC2626",
        amber:          { DEFAULT: "#BA7517", light: "#FEF3C7" },
        "tottus-green": "#00843D",
        "santa-pink":   "#E91E63",
        "lider-purple": "#7E6BC4",
        "unimarc-red":  "#DC2626",

        // ── Fondos y superficies (light) ───────────────────────────────
        "bg-page":   "#F4F4F0",
        "bg-card":   "#FFFFFF",
        "bg-input":  "#F0F0EA",
        border:      "#E2E2DA",

        // ── Fondos oscuros (dark) — se usan vía dark:bg-dark-* ─────────
        "dark-page":    "#0F172A",
        "dark-surface": "#1E293B",
        "dark-card":    "#243146",
        "dark-border":  "#334155",
        "dark-input":   "#1E293B",

        // ── Footer ─────────────────────────────────────────────────────
        footer: "#1E1B4B",

        // ── Texto ──────────────────────────────────────────────────────
        "ink-weak": "#6B7280",
      },

      // Gradientes de marca disponibles como clase utilitaria
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #0D9488 0%, #7E6BC4 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, #E6FBF8 0%, #F0EEFF 100%)",
        "dark-gradient":
          "linear-gradient(135deg, #0F172A 0%, #1a1040 100%)",
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

      boxShadow: {
        "teal-glow":   "0 4px 24px rgba(13, 148, 136, 0.18)",
        "purple-glow": "0 4px 24px rgba(126, 107, 196, 0.18)",
        "card-hover":  "0 8px 32px rgba(0,0,0,0.10)",
      },

      animation: {
        "ticker": "ticker 20s linear infinite",
        "fade-up": "fadeUp 0.4s ease-out",
      },

      keyframes: {
        ticker: {
          "0%":   { transform: "translateX(100vw)" },
          "100%": { transform: "translateX(-100%)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
