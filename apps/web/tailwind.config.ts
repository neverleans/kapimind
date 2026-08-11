import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Tokens mantidos do legado (js/config.js) para transição suave
        brand: {
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#fbbf24',
          red: '#ef4444',
          purple: '#8b5cf6',
        },
        // BERT-style institucional (sugestão para Fase 7)
        bull: {
          500: '#10b981',
          600: '#059669',
        },
        bear: {
          500: '#ef4444',
          600: '#dc2626',
        },
        // Surface colors para dark mode
        surface: {
          0: '#0B0F1A',
          1: '#111827',
          2: '#1F2937',
          3: '#374151',
          4: '#4B5563',
        },
      },
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
