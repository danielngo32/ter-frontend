import apiClient from '../utils/apiClient';

export const systemApi = {
  getProvinces: async () => {
    const response = await apiClient.get('/system/provinces');
    return response.data;
  },

  getProvinceByCode: async (code) => {
    const response = await apiClient.get(`/system/provinces/${code}`);
    return response.data;
  },

  getWards: async (provinceCode, provinceId) => {
    const params = {};
    if (provinceCode) params.provinceCode = provinceCode;
    if (provinceId) params.provinceId = provinceId;
    const response = await apiClient.get('/system/wards', { params });
    return response.data;
  },

  getWardByCode: async (code) => {
    const response = await apiClient.get(`/system/wards/${code}`);
    return response.data;
  },

  getBusinessCategories: async () => {
    const response = await apiClient.get('/system/business-categories');
    return response.data;
  },

  getParentBusinessCategories: async () => {
    const response = await apiClient.get('/system/business-categories/parents');
    return response.data;
  },

  getSubBusinessCategories: async (parentId) => {
    const response = await apiClient.get(`/system/business-categories/parents/${parentId}/children`);
    return response.data;
  },

  getAppModules: async () => {
    const response = await apiClient.get('/system/app-modules');
    return response.data;
  },
};

