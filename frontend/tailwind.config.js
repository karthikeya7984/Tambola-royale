/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#7c3aed', dark: '#6d28d9' },
        accent: '#f59e0b',
        bg: { dark: '#0f0f1a', card: '#1a1a2e' },
      },
      fontFamily: { display: ['Poppins', 'sans-serif'] },
    },
  },
  plugins: [],
};
