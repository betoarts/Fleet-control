/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nba-blue': '#1D428A',
        'nba-red': '#C8102E',
        'apple-blue': '#0071E3',
        'apple-gray': '#F5F5F7',
        'apple-dark': '#1D1D1F',
        'apple-subtle': '#86868B',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 16px 48px -8px rgba(0, 0, 0, 0.1)',
        'glass-float': '0 12px 36px -4px rgba(0, 0, 0, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'glass-card': '0 10px 30px -5px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}
