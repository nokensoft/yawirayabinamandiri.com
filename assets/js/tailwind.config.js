// Tailwind Play CDN config — warna diambil dari logo YBM
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#0E3A78',   // biru tua logo
        sky: '#1BA3DE',    // biru muda logo
        accent: '#F39A2B', // oranye logo
        ink: '#0F1626',
        surface: '#F1F2F4',
      },
    },
  },
};
