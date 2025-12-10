const SUPPORTED_LOCALES = ['en', 'vi'];
const DEFAULT_LOCALE = 'en';
const FALLBACK_LABELS = {
  en: 'English',
  vi: 'Tiếng Việt',
};

const isBrowser = typeof window !== 'undefined';

export const normalizeLocale = (locale) => {
  if (!locale || typeof locale !== 'string') {
    return DEFAULT_LOCALE;
  }
  const lower = locale.toLowerCase();
  const short = lower.includes('-') ? lower.split('-')[0] : lower;
  return SUPPORTED_LOCALES.includes(short) ? short : DEFAULT_LOCALE;
};

export const getStoredLocale = () => {
  if (!isBrowser) return null;
  return window.localStorage.getItem('preferredLocale');
};

export const detectBrowserLocale = () => {
  if (!isBrowser) return null;
  if (Array.isArray(window.navigator.languages) && window.navigator.languages.length > 0) {
    return normalizeLocale(window.navigator.languages[0]);
  }
  if (window.navigator.language) {
    return normalizeLocale(window.navigator.language);
  }
  return null;
};

export const detectPreferredLocale = () => {
  const stored = getStoredLocale();
  if (stored) {
    return normalizeLocale(stored);
  }

  const browserLocale = detectBrowserLocale();
  if (browserLocale) {
    return browserLocale;
  }

  return DEFAULT_LOCALE;
};

export const stripLocaleFromPath = (path = '') => {
  if (!path || !path.startsWith('/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0])) {
  segments.shift();
  }
  return segments.length ? `/${segments.join('/')}` : '/';
};

export const replaceLocaleInPath = (newLocale, currentPath = '/') => {
  const normalized = normalizeLocale(newLocale);
  const remainder = stripLocaleFromPath(currentPath);
  return remainder ? `/${normalized}${remainder.startsWith('/') ? remainder : `/${remainder}`}` : `/${normalized}`;
};

export const getLocaleLabel = (locale, t) => {
  const normalized = normalizeLocale(locale);
  const key = normalized === 'vi' ? 'vietnamese' : 'english';
  if (typeof t === 'function') {
    try {
      const result = t(`languages.${key}`, { ns: 'common' });
      if (result && result !== `languages.${key}`) {
        return result;
      }
    } catch (e) {
    }
  }
  return FALLBACK_LABELS[normalized] || FALLBACK_LABELS[DEFAULT_LOCALE];
};

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };

