import i18n from '../../i18n/i18n';

export const productValidator = {
  productName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.productName.required') || 'Product name is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject(i18n.t('validation.productName.min') || 'Product name must be at least 1 character');
    }
    if (value.trim().length > 200) {
      return Promise.reject(i18n.t('validation.productName.max') || 'Product name must be less than 200 characters');
    }
    return Promise.resolve();
  },

  barcode: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.barcode.required') || 'Barcode is required');
    }
    if (value.trim().length < 3) {
      return Promise.reject(i18n.t('validation.barcode.min') || 'Barcode must be at least 3 characters');
    }
    if (value.trim().length > 50) {
      return Promise.reject(i18n.t('validation.barcode.max') || 'Barcode must be less than 50 characters');
    }
    return Promise.resolve();
  },

  price: (rule, value) => {
    if (value !== null && value !== undefined) {
      if (typeof value !== 'number' || value < 0) {
        return Promise.reject(i18n.t('validation.price.invalid') || 'Price must be a non-negative number');
      }
    }
    return Promise.resolve();
  },

  stock: (rule, value) => {
    if (value !== null && value !== undefined) {
      if (typeof value !== 'number' || value < 0) {
        return Promise.reject(i18n.t('validation.stock.invalid') || 'Stock must be a non-negative number');
      }
    }
    return Promise.resolve();
  },

  sku: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.sku.required') || 'SKU is required');
    }
    if (value.trim().length > 100) {
      return Promise.reject(i18n.t('validation.sku.max') || 'SKU must be less than 100 characters');
    }
    return Promise.resolve();
  },

  categoryName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.categoryName.required') || 'Category name is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject(i18n.t('validation.categoryName.min') || 'Category name must be at least 1 character');
    }
    if (value.trim().length > 200) {
      return Promise.reject(i18n.t('validation.categoryName.max') || 'Category name must be less than 200 characters');
    }
    return Promise.resolve();
  },

  brandName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.brandName.required') || 'Brand name is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject(i18n.t('validation.brandName.min') || 'Brand name must be at least 1 character');
    }
    if (value.trim().length > 200) {
      return Promise.reject(i18n.t('validation.brandName.max') || 'Brand name must be less than 200 characters');
    }
    return Promise.resolve();
  },

  promotionName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.promotionName.required') || 'Promotion name is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject(i18n.t('validation.promotionName.min') || 'Promotion name must be at least 1 character');
    }
    if (value.trim().length > 200) {
      return Promise.reject(i18n.t('validation.promotionName.max') || 'Promotion name must be less than 200 characters');
    }
    return Promise.resolve();
  },

  promotionValue: (type) => (rule, value) => {
    if (value === null || value === undefined) {
      return Promise.reject(i18n.t('validation.promotionValue.required') || 'Promotion value is required');
    }
    if (typeof value !== 'number' || value < 0) {
      return Promise.reject(i18n.t('validation.promotionValue.invalid') || 'Promotion value must be a non-negative number');
    }
    if (type === 'percentage' && value > 100) {
      return Promise.reject(i18n.t('validation.promotionValue.percentageMax') || 'Percentage promotion value cannot exceed 100');
    }
    return Promise.resolve();
  },

  dateRange: (getFieldValue) => (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.dateRange.endDateRequired') || 'End date is required');
    }
    const startAt = getFieldValue('startAt');
    if (!startAt) {
      return Promise.reject(i18n.t('validation.dateRange.startDateRequired') || 'Start date is required');
    }
    const start = new Date(startAt);
    const end = new Date(value);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return Promise.reject(i18n.t('validation.dateRange.invalid') || 'Invalid date format');
    }
    if (end <= start) {
      return Promise.reject(i18n.t('validation.dateRange.invalidRange') || 'End date must be after start date');
    }
    return Promise.resolve();
  },

  attributeName: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.attributeName.required') || 'Attribute name is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject(i18n.t('validation.attributeName.min') || 'Attribute name must be at least 1 character');
    }
    if (value.trim().length > 200) {
      return Promise.reject(i18n.t('validation.attributeName.max') || 'Attribute name must be less than 200 characters');
    }
    return Promise.resolve();
  },

  attributeValue: (rule, value) => {
    if (!value) {
      return Promise.reject(i18n.t('validation.attributeValue.required') || 'Attribute value is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject(i18n.t('validation.attributeValue.min') || 'Attribute value must be at least 1 character');
    }
    if (value.trim().length > 200) {
      return Promise.reject(i18n.t('validation.attributeValue.max') || 'Attribute value must be less than 200 characters');
    }
    return Promise.resolve();
  },
};

