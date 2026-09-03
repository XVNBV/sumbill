/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#070b16',
        panel: '#0d1322',
        raised: '#141b2e',
        line: '#1e2942',
        edge: '#2e3f63',
        brk: '#dbe4f7',
        dim: '#8493b4',
        neon: '#3be8ff',
        mag: '#ff5df0',
        blood: '#ff5470',
        volt: '#d0f34a',
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: 'inset 0 1px 0 rgba(219,228,247,0.05), 0 10px 30px rgba(0,0,0,0.45)',
        'neon-sm': '0 0 12px rgba(59,232,255,0.35)',
        neon: '0 0 0 1px rgba(59,232,255,0.45), 0 0 20px rgba(59,232,255,0.3), inset 0 0 12px rgba(59,232,255,0.06)',
        mag: '0 0 0 1px rgba(255,93,240,0.4), 0 0 18px rgba(255,93,240,0.25)',
        'neon-inset': 'inset 0 0 14px rgba(59,232,255,0.1)',
      },
      backgroundImage: {
        'cyber-grid':
          'linear-gradient(rgba(59,232,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,232,255,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '0.92' },
          '48%': { opacity: '0.75' },
          '50%': { opacity: '1' },
          '70%': { opacity: '0.95' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        pulseNeon: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px rgba(59,232,255,0.6)' },
          '50%': { opacity: '0.55', boxShadow: '0 0 2px rgba(59,232,255,0.25)' },
        },
      },
      animation: {
        flicker: 'flicker 6s linear infinite',
        scanline: 'scanline 9s linear infinite',
        pulseNeon: 'pulseNeon 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};