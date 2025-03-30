/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ku-red': '#8B0029',
        'ku-gray': '#4A4A4A',
      },
    },
  },
  plugins: [],
} 