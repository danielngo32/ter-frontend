import { productApi } from '../../api/product.api';

export const productService = {
  getProductByBarcode: async (barcode) => {
    return await productApi.getProductByBarcode(barcode);
  },

  listProducts: async (params = {}) => {
    return await productApi.listProducts(params);
  },

  getProductById: async (id) => {
    return await productApi.getProductById(id);
  },

  createProduct: async (data, files = {}) => {
    return await productApi.createProduct(data, files);
  },

  updateProduct: async (id, data, files = {}) => {
    return await productApi.updateProduct(id, data, files);
  },

  deleteProduct: async (id) => {
    return await productApi.deleteProduct(id);
  },

  deleteProductsBulk: async (ids) => {
    return await productApi.deleteProductsBulk(ids);
  },

  exportProducts: async (params = {}) => {
    return await productApi.exportProducts(params);
  },

  importProducts: async (file, options = {}) => {
    return await productApi.importProducts(file, options);
  },

  downloadSampleFile: async () => {
    return await productApi.downloadSampleFile();
  },

  copyProduct: async (id) => {
    return await productApi.copyProduct(id);
  },

  listCategories: async (params = {}) => {
    const response = await productApi.listCategories(params);
    return response.data || response;
  },

  createCategory: async (data) => {
    return await productApi.createCategory(data);
  },

  updateCategory: async (id, data) => {
    return await productApi.updateCategory(id, data);
  },

  deleteCategory: async (id) => {
    return await productApi.deleteCategory(id);
  },

  listBrands: async (params = {}) => {
    const response = await productApi.listBrands(params);
    return response.data || response;
  },

  createBrand: async (data) => {
    return await productApi.createBrand(data);
  },

  updateBrand: async (id, data) => {
    return await productApi.updateBrand(id, data);
  },

  deleteBrand: async (id) => {
    return await productApi.deleteBrand(id);
  },

  listPromotions: async (params = {}) => {
    const response = await productApi.listPromotions(params);
    return response.data || response;
  },

  getPromotionById: async (id) => {
    return await productApi.getPromotionById(id);
  },

  createPromotion: async (data) => {
    return await productApi.createPromotion(data);
  },

  updatePromotion: async (id, data) => {
    return await productApi.updatePromotion(id, data);
  },

  deletePromotion: async (id) => {
    return await productApi.deletePromotion(id);
  },

  getWarehouses: async () => {
    const response = await productApi.getWarehouses();
    return response.data || response;
  },

  getVariantInventories: async (productId, variantId) => {
    const response = await productApi.getVariantInventories(productId, variantId);
    return response.data || response;
  },

  listInventory: async (params = {}) => {
    const response = await productApi.listInventory(params);
    return response.data || response;
  },

  exportInventory: async (params = {}) => {
    return await productApi.exportInventory(params);
  },

  importInventory: async (file, options = {}) => {
    return await productApi.importInventory(file, options);
  },

  downloadInventorySample: async () => {
    return await productApi.downloadInventorySample();
  },

  bulkInventoryUpdate: async (payload) => {
    return await productApi.bulkInventoryUpdate(payload);
  },

  addVariantInventory: async (productId, variantId, data) => {
    return await productApi.addVariantInventory(productId, variantId, data);
  },

  updateVariantInventory: async (productId, variantId, inventoryId, data) => {
    return await productApi.updateVariantInventory(productId, variantId, inventoryId, data);
  },

  removeVariantInventory: async (productId, variantId, inventoryId) => {
    return await productApi.removeVariantInventory(productId, variantId, inventoryId);
  },

  listAttributes: async () => {
    const response = await productApi.listAttributes();
    return response.data || response;
  },

  getAttributeById: async (id) => {
    return await productApi.getAttributeById(id);
  },

  createAttribute: async (data) => {
    return await productApi.createAttribute(data);
  },

  updateAttribute: async (id, data) => {
    return await productApi.updateAttribute(id, data);
  },

  deleteAttribute: async (id) => {
    return await productApi.deleteAttribute(id);
  },

  listAttributeValues: async (params = {}) => {
    const response = await productApi.listAttributeValues(params);
    return response.data || response;
  },

  getAttributeValueById: async (id) => {
    return await productApi.getAttributeValueById(id);
  },

  createAttributeValue: async (data) => {
    return await productApi.createAttributeValue(data);
  },

  updateAttributeValue: async (id, data) => {
    return await productApi.updateAttributeValue(id, data);
  },

  deleteAttributeValue: async (id) => {
    return await productApi.deleteAttributeValue(id);
  },
};



