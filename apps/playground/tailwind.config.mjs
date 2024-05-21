import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.pattern-dots': {
          opacity: '0.06', // 20% opacity
          backgroundColor: '#ffffff', // white background
          backgroundImage: `radial-gradient(#6366F1 calc(20px * 0.1), #ffffff calc(20px * 0.1))`, // indigo dots on white background
          backgroundSize: '15px 15px', // size of the pattern
        },
      }
      addUtilities(newUtilities, ['responsive'])
    }),
  ],
}
