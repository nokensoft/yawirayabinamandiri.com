// =============================================================
// Bahasa (ID / EN) — memakai Google Translate yang disembunyikan
// =============================================================
const LANG_KEY = 'ybm-lang';

function getLang() {
  try { return localStorage.getItem(LANG_KEY) || 'id'; } catch (e) { return 'id'; }
}

function clearGoogTransCookie() {
  const expire = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = expire;
  const host = location.hostname;
  if (host) {
    document.cookie = `${expire}; domain=${host}`;
    document.cookie = `${expire}; domain=.${host.replace(/^www\./, '')}`;
  }
}

// Pilih bahasa pada dropdown Google Translate (tunggu sampai widget siap)
function applyGoogleLang(lang, tries = 0) {
  const combo = document.querySelector('.goog-te-combo');
  if (combo && combo.options.length) {
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  } else if (tries < 40) {
    setTimeout(() => applyGoogleLang(lang, tries + 1), 250);
  }
}

function setLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* abaikan */ }
  document.documentElement.lang = lang;
  if (lang === 'en') {
    document.cookie = 'googtrans=/id/en; path=/';
    applyGoogleLang('en');
  } else {
    // Kembali ke bahasa asli: hapus cookie lalu muat ulang halaman
    clearGoogTransCookie();
    location.reload();
  }
}

// Callback dari script Google Translate
window.googleTranslateInit = function () {
  new google.translate.TranslateElement(
    { pageLanguage: 'id', includedLanguages: 'en,id', autoDisplay: false },
    'google_translate_element'
  );
  if (getLang() === 'en') {
    document.documentElement.lang = 'en';
    applyGoogleLang('en');
  }
};

// =============================================================
// Cuaca Timika — Open-Meteo (tanpa API key)
// =============================================================
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-4.5467&longitude=136.8883&current=temperature_2m,weather_code&timezone=Asia%2FJayapura';
const WEATHER_CACHE = 'ybm-weather';

const WEATHER_MAP = [
  // [kode maksimum, ikon, label ID, label EN]
  [0, 'fa-sun', 'Cerah', 'Clear'],
  [2, 'fa-cloud-sun', 'Cerah berawan', 'Partly cloudy'],
  [3, 'fa-cloud', 'Berawan', 'Cloudy'],
  [48, 'fa-smog', 'Berkabut', 'Foggy'],
  [57, 'fa-cloud-rain', 'Gerimis', 'Drizzle'],
  [67, 'fa-cloud-showers-heavy', 'Hujan', 'Rain'],
  [77, 'fa-snowflake', 'Salju', 'Snow'],
  [82, 'fa-cloud-showers-heavy', 'Hujan lebat', 'Heavy showers'],
  [86, 'fa-snowflake', 'Salju', 'Snow'],
  [99, 'fa-cloud-bolt', 'Badai petir', 'Thunderstorm'],
];

async function fetchWeather() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(WEATHER_CACHE) || 'null');
    if (cached && Date.now() - cached.t < 15 * 60 * 1000) return cached;
  } catch (e) { /* abaikan */ }
  const res = await fetch(WEATHER_URL);
  const json = await res.json();
  const data = { t: Date.now(), temp: Math.round(json.current.temperature_2m), code: json.current.weather_code };
  try { sessionStorage.setItem(WEATHER_CACHE, JSON.stringify(data)); } catch (e) { /* abaikan */ }
  return data;
}

// =============================================================
// Komponen Alpine
// =============================================================
document.addEventListener('alpine:init', () => {
  // Topbar: tanggal, jam real-time (WIT), cuaca, bahasa
  Alpine.data('topbar', () => ({
    now: new Date(),
    lang: getLang(),
    temp: null,
    code: null,

    init() {
      setInterval(() => { this.now = new Date(); }, 1000);
      fetchWeather()
        .then((w) => { this.temp = w.temp; this.code = w.code; })
        .catch(() => { /* cuaca tidak tersedia — tampilkan placeholder */ });
    },

    get date() {
      return this.now.toLocaleDateString(this.lang === 'en' ? 'en-GB' : 'id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jayapura',
      });
    },

    get time() {
      return this.now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jayapura',
      }) + ' WIT';
    },

    get weather() {
      if (this.code === null) return { icon: 'fa-cloud-sun', label: this.lang === 'en' ? 'Weather' : 'Cuaca' };
      const row = WEATHER_MAP.find(([max]) => this.code <= max) || WEATHER_MAP[WEATHER_MAP.length - 1];
      return { icon: row[1], label: this.lang === 'en' ? row[3] : row[2] };
    },

    setLang(lang) {
      if (lang === this.lang) return;
      this.lang = lang;
      setLang(lang);
    },
  }));

  // Angka berjalan: x-data="counter(184)" x-intersect.once="start()"
  Alpine.data('counter', (target, duration = 1400) => ({
    value: target,
    start() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        this.value = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      this.value = 0;
      requestAnimationFrame(tick);
    },
  }));
});
