/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}',
    './node_modules/@schoolquiz/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--app-font)', 'system-ui', 'sans-serif'],
      },
      colors: {
        round: {
          1: '#F4A261',
          2: '#7FB3FF',
          3: '#F7A8C0',
          4: '#9EE6B4',
          5: '#F7D57A',
        },
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.22,1,0.36,1)',
        'ease-inout-sine': 'cubic-bezier(0.45,0,0.40,1)',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-round-1', 'bg-round-2', 'bg-round-3', 'bg-round-4', 'bg-round-5',
    'text-round-1', 'text-round-2', 'text-round-3', 'text-round-4', 'text-round-5',
    'border-round-1','border-round-2','border-round-3','border-round-4','border-round-5',
  ],
};
