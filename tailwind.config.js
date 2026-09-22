/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#060B14',
          850: '#0A1120',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
        },
        cyan: {
          DEFAULT: '#00F2FE',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          glow: '#00F2FE',
        },
        vsb: {
          blue: '#1D4ED8',
          accent: '#00F2FE',
          emerald: '#10B981',
          gold: '#F59E0B',
          dark: '#060B14',
          card: '#0A1324',
          border: 'rgba(34, 211, 238, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'Helvetica', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Times New Roman"', 'Times', 'Georgia', 'serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -5px rgba(0, 242, 254, 0.3)',
        'cyan-glow-lg': '0 0 35px -5px rgba(0, 242, 254, 0.45)',
        'blue-glow': '0 0 25px -5px rgba(29, 78, 216, 0.4)',
        'emerald-glow': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'trace-flow': 'trace 8s linear infinite',
      },
      keyframes: {
        trace: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
