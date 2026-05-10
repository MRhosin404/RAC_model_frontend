/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        al: {
          bg:       '#eef1f6',
          card:     '#ffffff',
          nav:      '#ffffff',
          sidebar:  '#f8fafc',
          border:   '#e2e8f0',
          text:     '#1e293b',
          sub:      '#64748b',
          muted:    '#94a3b8',
          green:    '#22c55e',
          'green-bg': '#dcfce7',
          navy:     '#1e3a5f',
          'navy-lt': '#2d5082',
          offline:  '#64748b',
          'bar-on': '#334155',
          'bar-off':'#cbd5e1',
          chart:    '#3b82f6',
          'chart-fill': '#dbeafe',
          amber:    '#f59e0b',
          teal:     '#0d9488',
          red:      '#ef4444',
        },
      },
      boxShadow: {
        card:   '0 2px 12px rgba(0,0,0,0.07)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.10)',
        nav:    '0 1px 4px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow':'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:0 },                             to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:'translateY(20px)'},to:{ opacity:1, transform:'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
