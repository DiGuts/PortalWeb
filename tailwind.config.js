/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flat aliases kept for existing code
        'porcelain':   '#f7f7f2',
        'dusty-olive': '#7a8a6b',
        'mahogany':    '#bf211e',
        'carbon':      '#222725',
        'ink':         '#040f0f',
        // Numeric scale (design tokens)
        'porcelain-50':  '#faf9f6',
        'porcelain-100': '#f0eee9',
        'porcelain-200': '#e3e2db',
        'porcelain-300': '#d2d0c6',
        'mahogany-100':  '#fbe4e3',
        'mahogany-500':  '#d63a37',
        'mahogany-600':  '#bf211e',
        'carbon-700':    '#2f3432',
        'carbon-800':    '#222725',
        'carbon-900':    '#1a1d1c',
        'ink-500':       '#7d8683',
        'ink-700':       '#4a5250',
        'ink-900':       '#222725',
        // Accent variants (toggleable theme)
        'terracotta':    '#c2532a',
        'oxblood':       '#8a2623',
        'clay':          '#b55139',
      },
      fontFamily: {
        serif: ['"Anthropic Serif"', '"Times New Roman"', 'serif'],
        sans:  ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}

