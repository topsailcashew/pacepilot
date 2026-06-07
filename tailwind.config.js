/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        deepnavy:     'rgb(var(--color-bg)      / <alpha-value>)',
        prussianblue: 'rgb(var(--color-surface) / <alpha-value>)',
        'pilot-orange': '#F37324',
        whitesmoke: '#F7F4F3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
