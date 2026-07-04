/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B3A1E',
          light: '#25502A',
          dark: '#0F2411',
        },
        cream: '#F7F5F0',
        gold: {
          DEFAULT: '#C99A3E',
          dark: '#A87F2F',
        },
        charcoal: '#2A2A2A',
        line: '#DEDACF',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
