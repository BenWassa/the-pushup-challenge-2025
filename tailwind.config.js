/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      'brand-orange': '#FFA400',
      'brand-orange-soft': '#FAA92B',
      'neutral-white': '#FFFFFF',
      'neutral-black': '#000000',
      'neutral-gray-light': '#F2F2F2',
      'neutral-gray-lighter': '#F3F6F8',
      'neutral-gray-mid': '#858585',
      'neutral-gray-text': '#5C5C5C',
    },
    extend: {
      borderRadius: {
        leaf: '48px',
        leafSm: '30px',
        card: '15px',
      },

      boxShadow: {
        soft: '0px 4px 50px rgba(128,128,128,0.15)',
        active: '0px 10px 20px rgba(255,164,0,0.2)',
        heavy: '0px 4px 25px rgba(128,128,128,0.3)',
      },

      fontSize: {
        hero: ['80px', { lineHeight: '1.05' }],
        display: ['70px', { lineHeight: '1.1' }],
        section: ['30px', { lineHeight: '1.2' }],
        body: ['16px', { lineHeight: '1.6' }],
        meta: ['14px', { lineHeight: '1.4' }],
      },

      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
