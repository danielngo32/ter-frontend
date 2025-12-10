import i18n from '../../i18n/i18n';

export const authValidator = {
  email: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.email.required'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(i18n.t('validation.email.invalid'));
    }
    return Promise.resolve();
  },

  password: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.password.required'));
    }
    return Promise.resolve();
  },

  fullName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.fullName.required'));
    }
    if (value.length < 3) {
      return Promise.reject(i18n.t('validation.fullName.min'));
    }
    if (value.length > 120) {
      return Promise.reject(i18n.t('validation.fullName.max'));
    }
    return Promise.resolve();
  },

  phoneNumber: (rule, value) => {
    if (value && value.length > 0) {
      if (value.length < 6) {
        return Promise.reject(i18n.t('validation.phone.min'));
      }
      if (value.length > 20) {
        return Promise.reject(i18n.t('validation.phone.max'));
      }
    }
    return Promise.resolve();
  },

  confirmPassword: (getFieldValue) => (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.confirmPassword.required'));
    }
    if (value !== getFieldValue('password')) {
      return Promise.reject(i18n.t('validation.confirmPassword.mismatch'));
    }
    return Promise.resolve();
  },

  captcha: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.captcha.required'));
    }
    if (value.length !== 4) {
      return Promise.reject(i18n.t('validation.captcha.invalid'));
    }
    return Promise.resolve();
  },

  tenantName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.tenantName.required'));
    }
    if (value.length < 2) {
      return Promise.reject(i18n.t('validation.tenantName.min'));
    }
    if (value.length > 200) {
      return Promise.reject(i18n.t('validation.tenantName.max'));
    }
    return Promise.resolve();
  },

  slug: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.slug.required'));
    }
    if (value.length < 2) {
      return Promise.reject(i18n.t('validation.slug.min'));
    }
    if (value.length > 100) {
      return Promise.reject(i18n.t('validation.slug.max'));
    }
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(value)) {
      return Promise.reject(i18n.t('validation.slug.invalid'));
    }
    return Promise.resolve();
  },

  businessCategory: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.businessCategory.required'));
    }
    return Promise.resolve();
  },

  tenantSlug: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.slug.required'));
    }
    if (value.length < 2) {
      return Promise.reject(i18n.t('validation.slug.min'));
    }
    if (value.length > 100) {
      return Promise.reject(i18n.t('validation.slug.max'));
    }
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(value)) {
      return Promise.reject(i18n.t('validation.slug.invalid'));
    }
    return Promise.resolve();
  },
};
