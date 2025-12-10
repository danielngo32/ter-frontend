
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enAuth from './locates/en/auth.json';
import viAuth from './locates/vi/auth.json';
import enCommon from './locates/en/common.json';
import viCommon from './locates/vi/common.json';
import enProduct from './locates/en/product.json';
import viProduct from './locates/vi/product.json';
import enCrm from './locates/en/crm.json';
import viCrm from './locates/vi/crm.json';
import { detectPreferredLocale, DEFAULT_LOCALE } from '../utils/locale';

const resources = {
  en: {
    auth: enAuth,
    common: enCommon,
    product: enProduct,
    crm: enCrm,
  },
  vi: {
    auth: viAuth,
    common: viCommon,
    product: viProduct,
    crm: viCrm,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectPreferredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: ['auth', 'common', 'product', 'crm'],
  defaultNS: 'auth',
  interpolation: {
    escapeValue: false,
  },
  returnObjects: true,
});

export default i18n;

