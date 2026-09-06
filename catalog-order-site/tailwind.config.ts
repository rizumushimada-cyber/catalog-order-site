import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './context/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4fb',
          100: '#d9e6f5',
          200: '#b3cceb',
          300: '#82abdc',
          400: '#4f7fc4',
          500: '#2e5ea8',
          600: '#204a8a',
          700: '#1a3b6e',
          800: '#162f56',
          900: '#132848',
        },
        ink: '#1c2430',
        line: '#e2e6ec',
      },
      fontFamily: {
        sans: [
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Noto Sans JP',
          'Yu Gothic',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
