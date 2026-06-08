/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
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
