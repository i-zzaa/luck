/** @type {import('tailwindcss').Config} */
/* eslint-disable no-undef */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.ts'],
  theme: {
    fontSize: {
      xs: 10,
      sm: 10,
      md: 12,
      lg: 18,
      xl: 28,
    },
    colors: {
      white: '#FFFFFF',
      'yellow-400': '#FACC15',
      'gray-200': '#e4e4e7',
      'gray-300': '#D3D3D3',
      'gray-400': '#CBCBCB',
      'gray-800': '#52525B',
      'violet-800': '#662977',
      'violet-600': '#66297780',
      'red-400': '#f87171',
      'red-900': '#7f1d1d',
      'green-400': '#4ade80',
      black: '#000000',
      to: '#ef6c00',
      psico: '#8e24aa',
      fono: '#f6bf26',
      psicopedag: '#000000',
    },
    extend: {
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
        'sans-serif': 'sans-serif',
        inter: 'Inter',
      },
    },
  },
};
