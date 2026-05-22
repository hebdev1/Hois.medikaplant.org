import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'var(--font-poppins)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        serif: ['var(--font-lora)', 'serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          DEFAULT: '#c43178',
          dark: '#9d2961',
        },
        ink: {
          DEFAULT: '#050040',
          muted: '#5b5a7a',
        },
        // Naturopathic palette pulled from the dashboard wireframe
        forest: {
          50: '#f3f8ef',
          100: '#e6f1de',
          200: '#cce3bd',
          300: '#a8cb8c',
          400: '#7aaf52',
          500: '#5a9138',
          600: '#3f7522',
          700: '#2d5a1b',
          800: '#1e3a0f',
          900: '#162d0a',
        },
        gold: {
          50: '#fdf8e7',
          100: '#faedc2',
          200: '#f1d985',
          300: '#e0c155',
          400: '#c9a227',
          500: '#a8851e',
          600: '#856915',
          700: '#634d0e',
        },
        cream: {
          50: '#fefcf6',
          100: '#faf6ed',
          200: '#f1ead7',
          300: '#cfc09a',
        },
        earth: {
          400: '#a07b6a',
          500: '#8e6552',
          600: '#5c3d2e',
          700: '#3a2218',
        },
      },
      boxShadow: {
        card: '0 12px 40px -16px rgba(5,0,64,0.18)',
        cardHover: '0 20px 50px -16px rgba(5,0,64,0.28)',
        plant: '0 24px 60px -20px rgba(30,58,15,0.45)',
        hero: '0 30px 80px -30px rgba(30,58,15,0.45)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseGold: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.4' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-8px) scale(0.96)' },
        },
        wiggle: {
          '0%, 60%, 100%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(-12deg)' },
          '20%': { transform: 'rotate(10deg)' },
          '30%': { transform: 'rotate(-8deg)' },
          '40%': { transform: 'rotate(6deg)' },
          '50%': { transform: 'rotate(-3deg)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease forwards',
        shimmer: 'shimmer 2s linear infinite',
        pulseGold: 'pulseGold 2s ease-in-out infinite',
        toastIn: 'toastIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        toastOut: 'toastOut 0.32s ease forwards',
        wiggle: 'wiggle 2.4s ease-in-out infinite',
        slideInLeft:
          'slideInLeft 0.26s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        fadeIn: 'fadeIn 0.2s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
