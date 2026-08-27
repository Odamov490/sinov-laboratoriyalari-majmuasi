/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B3A63',
          light: '#155D8A',
        },
        secondary: '#155D8A',
        accent: '#D9A441',
        bg: '#FFFFFF',
        'bg-light': '#F5F8FB',
        ink: '#17212B',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,58,99,0.06), 0 4px 16px rgba(11,58,99,0.06)',
      },
    },
  },
  plugins: [],
};
