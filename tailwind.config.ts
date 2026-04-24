import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#23cb69',
        secondary:  '#1aaa55',
        cta:        '#000000',
        'cta-dark': '#222222',
        accent:     '#e8faf2',
        'text-dark':'#000000',
      },
      fontFamily: {
        heading: ['var(--font-rubik)', 'sans-serif'],
        body:    ['var(--font-nunito)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
