/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muggy: {
          pink: '#FF0080',
          pinkSoft: '#FFE5F2',
          pinkPastel: '#FFB3D9',
          blue: '#00C2FF',
          blueSoft: '#E0F7FF',
          bluePastel: '#99E6FF',
          yellow: '#FFF04D',
          yellowSoft: '#FFFCE0',
          yellowPastel: '#FFF685',
          cream: '#F9E8D2',
          creamLight: '#FDF6EC',
          dark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Nunito"', 'system-ui', 'sans-serif'],
        display: ['"Fredoka"', '"Nunito"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'muggy': '0 10px 30px -5px rgba(255, 0, 128, 0.08), 0 4px 12px -2px rgba(0, 194, 255, 0.06)',
        'muggy-hover': '0 16px 35px -5px rgba(255, 0, 128, 0.14), 0 6px 16px -2px rgba(0, 194, 255, 0.1)',
        'card': '0 4px 20px -2px rgba(30, 41, 59, 0.05)',
      }
    },
  },
  plugins: [],
}
