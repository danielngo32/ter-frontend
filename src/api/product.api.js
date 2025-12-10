import apiClient from '../utils/apiClient';

export const productApi = {
  getProductByBarcode: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${encodeURIComponent(barcode)}`);
    return response.data;
  },

  listProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  exportProducts: async (params = {}) => {
    const {
      columns,
      filters,
      filterMode,
      status,
      categoryId,
      brandId,
      search,
    } = params;

    const query = {};
    if (columns) {
      query.columns = Array.isArray(columns) ? columns.join(',') : columns;
    }
    if (filters) {
      query.filters = typeof filters === 'string' ? filters : JSON.stringify(filters);
    }
    if (filterMode) query.filterMode = filterMode;
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    if (brandId) query.brandId = brandId;
    if (search) query.search = search;

    const response = await apiClient.get('/products/export', {
      params: query,
      responseType: 'blob',
    });
    return response;
  },

  createProduct: async (data, files = {}) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'variants' || key === 'baseBarcodes' || key === 'images' || key === 'basePricing' || key === 'baseInventory') {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, JSON.stringify(data[key]));
        }
      } else if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === 'boolean') {
          formData.append(key, data[key].toString());
        } else if (typeof data[key] === 'number') {
          formData.append(key, data[key].toString());
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    if (files.productImages && Array.isArray(files.productImages)) {
      files.productImages.forEach(file => {
        if (file instanceof File) {
          formData.append('productImages', file);
        }
      });
    }

    if (files.variantImages && Array.isArray(files.variantImages)) {
      files.variantImages.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`variantImage_${index}`, file);
        }
      });
    }

    const response = await apiClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProduct: async (id, data, files = {}) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'variants' || key === 'baseBarcodes' || key === 'images' || key === 'basePricing' || key === 'baseInventory') {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, JSON.stringify(data[key]));
        }
      } else if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === 'boolean') {
          formData.append(key, data[key].toString());
        } else if (typeof data[key] === 'number') {
          formData.append(key, data[key].toString());
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    if (files.productImages && Array.isArray(files.productImages)) {
      files.productImages.forEach(file => {
        if (file instanceof File) {
          formData.append('productImages', file);
        }
      });
    }

    const response = await apiClient.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  deleteProductsBulk: async (ids) => {
    const response = await apiClient.delete('/products/bulk', { data: { ids } });
    return response.data;
  },

  importProducts: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.duplicateSkuAction) {
      formData.append('duplicateSkuAction', options.duplicateSkuAction);
    }
    if (options.duplicateBarcodeAction) {
      formData.append('duplicateBarcodeAction', options.duplicateBarcodeAction);
    }
    if (options.duplicateCategoryAction) {
      formData.append('duplicateCategoryAction', options.duplicateCategoryAction);
    }
    if (options.duplicateBrandAction) {
      formData.append('duplicateBrandAction', options.duplicateBrandAction);
    }
    if (options.duplicateVariantSkuAction) {
      formData.append('duplicateVariantSkuAction', options.duplicateVariantSkuAction);
    }
    if (options.missingRequiredFieldAction) {
      formData.append('missingRequiredFieldAction', options.missingRequiredFieldAction);
    }
    if (options.invalidImageUrlAction) {
      formData.append('invalidImageUrlAction', options.invalidImageUrlAction);
    }
    if (options.selectedSheets && Array.isArray(options.selectedSheets) && options.selectedSheets.length > 0) {
      formData.append('selectedSheets', JSON.stringify(options.selectedSheets));
    }
    const response = await apiClient.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadSampleFile: async () => {
    const response = await apiClient.get('/products/import/sample', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau-import-san-pham.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  copyProduct: async (id) => {
    const response = await apiClient.post(`/products/${id}/copy`);
    return response.data;
  },

  listCategories: async (params = {}) => {
    const response = await apiClient.get('/products/categories', { params });
    return response.data;
  },

  createCategory: async (data) => {
    const response = await apiClient.post('/products/categories', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await apiClient.put(`/products/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/products/categories/${id}`);
    return response.data;
  },

  listBrands: async (params = {}) => {
    const response = await apiClient.get('/products/brands', { params });
    return response.data;
  },

  createBrand: async (data) => {
    const response = await apiClient.post('/products/brands', data);
    return response.data;
  },

  updateBrand: async (id, data) => {
    const response = await apiClient.put(`/products/brands/${id}`, data);
    return response.data;
  },

  deleteBrand: async (id) => {
    const response = await apiClient.delete(`/products/brands/${id}`);
    return response.data;
  },

  listPromotions: async (params = {}) => {
    const response = await apiClient.get('/products/promotions', { params });
    return response.data;
  },

  getPromotionById: async (id) => {
    const response = await apiClient.get(`/products/promotions/${id}`);
    return response.data;
  },

  createPromotion: async (data) => {
    const response = await apiClient.post('/products/promotions', data);
    return response.data;
  },

  updatePromotion: async (id, data) => {
    const response = await apiClient.put(`/products/promotions/${id}`, data);
    return response.data;
  },

  deletePromotion: async (id) => {
    const response = await apiClient.delete(`/products/promotions/${id}`);
    return response.data;
  },

  getWarehouses: async () => {
    const response = await apiClient.get('/products/warehouses');
    return response.data;
  },

  getVariantInventories: async (productId, variantId) => {
    const response = await apiClient.get(`/products/${productId}/variants/${variantId}/inventory`);
    return response.data;
  },

  listInventory: async (params = {}) => {
    const response = await apiClient.get('/products/inventory', { params });
    return response.data;
  },

  exportInventory: async (params = {}) => {
    const { columns, ...rest } = params;
    const query = {};
    Object.entries(rest || {}).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query[key] = val;
      }
    });
    if (columns) {
      query.columns = Array.isArray(columns) ? columns.join(',') : columns;
    }
    const response = await apiClient.get('/products/inventory/export', {
      params: query,
      responseType: 'blob',
    });
    return response;
  },

  importInventory: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.applyTo) {
      formData.append('applyTo', options.applyTo);
    }
    if (options.mode) {
      formData.append('mode', options.mode);
    }
    const response = await apiClient.post('/products/inventory/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadInventorySample: async () => {
    const response = await apiClient.get('/products/inventory/import/sample', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory-import-sample.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  bulkInventoryUpdate: async (payload) => {
    const response = await apiClient.post('/products/inventory/bulk', payload);
    return response.data;
  },

  addVariantInventory: async (productId, variantId, data) => {
    const response = await apiClient.post(`/products/${productId}/variants/${variantId}/inventory`, data);
    return response.data;
  },

  updateVariantInventory: async (productId, variantId, inventoryId, data) => {
    const response = await apiClient.put(`/products/${productId}/variants/${variantId}/inventory/${inventoryId}`, data);
    return response.data;
  },

  removeVariantInventory: async (productId, variantId, inventoryId) => {
    const response = await apiClient.delete(`/products/${productId}/variants/${variantId}/inventory/${inventoryId}`);
    return response.data;
  },

  listAttributes: async () => {
    const response = await apiClient.get('/products/attributes');
    return response.data;
  },

  getAttributeById: async (id) => {
    const response = await apiClient.get(`/products/attributes/${id}`);
    return response.data;
  },

  createAttribute: async (data) => {
    const response = await apiClient.post('/products/attributes', data);
    return response.data;
  },

  updateAttribute: async (id, data) => {
    const response = await apiClient.put(`/products/attributes/${id}`, data);
    return response.data;
  },

  deleteAttribute: async (id) => {
    const response = await apiClient.delete(`/products/attributes/${id}`);
    return response.data;
  },

  listAttributeValues: async (params = {}) => {
    const response = await apiClient.get('/products/attribute-values', { params });
    return response.data;
  },

  getAttributeValueById: async (id) => {
    const response = await apiClient.get(`/products/attribute-values/${id}`);
    return response.data;
  },

  createAttributeValue: async (data) => {
    const response = await apiClient.post('/products/attribute-values', data);
    return response.data;
  },

  updateAttributeValue: async (id, data) => {
    const response = await apiClient.put(`/products/attribute-values/${id}`, data);
    return response.data;
  },

  deleteAttributeValue: async (id) => {
    const response = await apiClient.delete(`/products/attribute-values/${id}`);
    return response.data;
  },
};

