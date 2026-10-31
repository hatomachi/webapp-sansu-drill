/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          blue: '#2563EB',
          silver: '#94A3B8',
          gold: '#F59E0B',
          bg: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: [
          '"Hiragino Maru Gothic ProN"',
          '"Hiragino Kaku Gothic ProN"',
          '"BIZ UDPGothic"',
          'Meiryo',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
