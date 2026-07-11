import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  // 'class' mode — UserAppearance toggles `.dark` on <html> based on the
  // dark_mode preference. Using class instead of media so admin/user can
  // override their system preference.
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'var(--font-poppins)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        serif: ['var(--font-lora)', 'serif'],
      },
      colors: {
        brand: {
          50: '#f4f8e9',
          100: '#e6f0c9',
          200: '#d0e394',
          300: '#b3d35c',
          400: '#93bd33',
          500: '#6f9a1e',
          600: '#587d17',
          700: '#456012',
          800: '#354b0f',
          900: '#28390b',
        },
        accent: {
          DEFAULT: '#d24c28',
          dark: '#a83a1e',
          // shadcn primitives use bg-accent/text-accent-foreground on
          // their outline / ghost hover variants. White reads well on
          // top of the brand pink.
          foreground: '#ffffff',
        },
        ink: {
          DEFAULT: '#050040',
          muted: '#5b5a7a',
        },
        // shadcn token aliases — read the HSL CSS variables defined in
        // app/globals.css. Used by <Button>, <Badge>, BentoPricing.
        // <alpha-value> lets opacity modifiers like /50 work.
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        // Naturopathic palette pulled from the dashboard wireframe
        forest: {
          50: '#f6f8ec',
          100: '#eaefce',
          200: '#dfe1b5',
          300: '#c5cf5e',
          400: '#93b031',
          500: '#65881a',
          600: '#547216',
          700: '#435b12',
          800: '#33450e',
          900: '#23300a',
        },
        gold: {
          50: '#fdf4e1',
          100: '#fbe4bb',
          200: '#f5c877',
          300: '#eeac41',
          400: '#e78e17',
          500: '#c1750f',
          600: '#985c0c',
          700: '#6f4409',
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
        plant: '0 24px 60px -20px rgba(51,69,14,0.45)',
        hero: '0 30px 80px -30px rgba(51,69,14,0.45)',
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
