/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: 'var(--brand-400, #818cf8)',
          500: 'var(--brand-500, #6366f1)',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: 'var(--surface-default, #0f172a)',
          card:    'var(--surface-card, #1e293b)',
          border:  'var(--surface-border, #334155)',
          hover:   'var(--surface-hover, #253347)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        'gradient-dark':  'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      },
      animation: {
        'spin-slow':      'spin 3s linear infinite',
        'fade-in':        'fadeIn 0.3s ease-in-out',
        'fade-in-slow':   'fadeIn 0.6s ease-in-out',
        'fade-in-fast':   'fadeIn 0.15s ease-in-out',
        'slide-up':       'slideUp 0.4s ease-out',
        'slide-up-sm':    'slideUp 0.3s ease-out',
        'slide-up-lg':    'slideUp 0.5s ease-out',
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-brand':    'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-subtle':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-gentle':   'pulse 4s ease-in-out infinite',
        'pulse-slow':     'pulse 5s ease-in-out infinite',
        'bounce-light':   'bounceLight 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:    { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:    { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      boxShadow: {
        'brand':      '0 4px 24px -4px rgba(99,102,241,0.4)',
        'brand-glow': '0 0 24px rgba(99,102,241,0.3), 0 0 48px rgba(99,102,241,0.15)',
        'emerald':    '0 4px 24px -4px rgba(16,185,129,0.3)',
        'emerald-glow': '0 0 24px rgba(16,185,129,0.3), 0 0 48px rgba(16,185,129,0.15)',
        'rose':       '0 4px 24px -4px rgba(244,63,94,0.3)',
        'rose-glow':  '0 0 24px rgba(244,63,94,0.3), 0 0 48px rgba(244,63,94,0.15)',
        'card':       '0 0 0 1px rgba(51,65,85,0.8), 0 8px 32px -8px rgba(0,0,0,0.5)',
        'glow':       '0 0 32px rgba(99,102,241,0.25)',
        'lg-glow':    '0 0 48px rgba(99,102,241,0.35)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'bounce-ease': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
};

