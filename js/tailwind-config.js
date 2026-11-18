/**
 * Configuração do tema do Tailwind CSS (CDN)
 */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        auto: {
          950: '#090d16',
          900: '#111827',
          800: '#1e293b',
          700: '#334155',
        }
      }
    }
  }
};
