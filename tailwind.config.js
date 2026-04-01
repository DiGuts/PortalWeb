/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'porcelain':    '#f7f7f2',
        'dusty-olive':  '#788475',
        'mahogany':     '#bf211e',
        'carbon':       '#222725',
        'ink':          '#040f0f',
      },
    },
  },
  plugins: [],
}

