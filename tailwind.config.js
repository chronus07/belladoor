/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bella: {
          50: '#fdf4f7',
          100: '#fbe8f0',
          200: '#f7d2e2',
          300: '#f1adcb',
          400: '#e87ba9',
          500: '#dc528b',
          600: '#c73670',
          700: '#ab2759',
          800: '#8e234b',
          900: '#772242',
          950: '#480e23',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
