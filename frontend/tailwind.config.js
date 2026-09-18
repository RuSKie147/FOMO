/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: '#B8FF00',
        obsidian: '#080808',
        pixel: {
          gray: '#262626',
          dark: '#111111'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(184, 255, 0, 1)',
        'pixel-hover': '2px 2px 0px 0px rgba(184, 255, 0, 1)',
        'pixel-white': '4px 4px 0px 0px rgba(255, 255, 255, 1)',
      }
    },
  },
  plugins: [],
}
