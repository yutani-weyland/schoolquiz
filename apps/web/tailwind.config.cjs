/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}',
    './node_modules/@schoolquiz/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: { 
      center: true, 
      padding: { 
        DEFAULT: "1rem", 
        sm: "1.25rem", 
        lg: "2rem" 
      } 
    },
    extend: {
      fontFamily: {
        sans: ['var(--app-font)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid type using clamp for headings
        "display": ["clamp(2.4rem, 3.8vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "headline": ["clamp(1.4rem, 1.6vw, 2.2rem)", { lineHeight: "1.15" }],
        "title": ["clamp(1.25rem, 1.4vw + 0.6rem, 2rem)", { lineHeight: "1.15" }],
        "body": ["clamp(1rem, 0.45vw + 0.9rem, 1.125rem)", { lineHeight: "1.55" }],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.12)",
      },
      spacing: {
        // Map to CSS vars for fluid rhythm
        "0.5x": "var(--space-0_5)",
        "1x": "var(--space-1)",
        "2x": "var(--space-2)",
        "3x": "var(--space-3)",
        "4x": "var(--space-4)",
        "6x": "var(--space-6)",
        "8x": "var(--space-8)",
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
