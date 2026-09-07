import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#598eff',
          500: '#3366f2',
          600: '#1f47d6',
          700: '#1a38ac',
          800: '#1b3189',
          900: '#1c2e6d',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
