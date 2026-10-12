/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#FFFFFF',
        surface2: '#F8F8F8',
        ink: '#1D1C1D',
        muted: '#616061',
        line: '#DDDDDD',
        primary: '#007A5A',
        primaryDark: '#148567',
        link: '#1264A3',
        accent: '#4A154B',
        danger: '#E01E5A',
        warning: '#8A6A00',
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Lato', 'system-ui', 'sans-serif'],
        mono: ['Lato', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
        cardHover: '0 4px 12px rgba(0, 0, 0, 0.10)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
