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
        teal:           { DEFAULT: '#0D9488', light: '#E6FBF8' },
        purple:         { DEFAULT: '#7E6BC4', light: '#F0EEFF' },
        'deal-red':     '#DC2626',
        amber:          { DEFAULT: '#BA7517' },
        'tottus-green': '#00843D',
        'santa-pink':   '#E91E63',
        'bg-page':      '#F4F4F0',
        'bg-card':      '#FAFAF7',
        'bg-input':     '#F0F0EA',
        border:         '#E2E2DA',
        footer:         '#1E1B4B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
