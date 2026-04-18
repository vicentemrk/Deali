import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal:           { DEFAULT: 'var(--color-teal)', light: 'var(--color-teal-light)' },
        purple:         { DEFAULT: 'var(--color-purple)', light: 'var(--color-purple-light)' },
        'deal-red':     'var(--color-danger)',
        amber:          { DEFAULT: 'var(--color-warn)' },
        'tottus-green': '#00843D',
        'santa-pink':   '#E91E63',
        'bg-page':      'var(--color-bg-page)',
        'bg-card':      'var(--color-bg-card)',
        'bg-input':     'var(--color-bg-input)',
        border:         'var(--color-border)',
        footer:         'var(--color-ink-strong)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          weak: 'var(--color-ink-weak)',
          strong: 'var(--color-ink-strong)',
        },
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
      },
      boxShadow: {
        soft: '0 10px 28px -18px rgba(15, 23, 42, 0.28)',
        card: '0 18px 45px -28px rgba(13, 148, 136, 0.35)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
