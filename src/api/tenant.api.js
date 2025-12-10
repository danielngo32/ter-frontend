import apiClient from '../utils/apiClient';

export const tenantApi = {
  createWorkspace: async (data) => {
    const response = await apiClient.post('/tenants', data);
    return response.data;
  },

  listWorkspaces: async () => {
    const response = await apiClient.get('/tenants');
    return response.data;
  },

  getWorkspaceBySlug: async (slug) => {
    const response = await apiClient.get(`/tenants/slug/${slug}`);
    return response.data;
  },

  getWorkspaceById: async (id) => {
    const response = await apiClient.get(`/tenants/${id}`);
    return response.data;
  },

  updateMetadata: async (id, data) => {
    const response = await apiClient.put(`/tenants/${id}`, data);
    return response.data;
  },

  updateModules: async (id, data) => {
    const response = await apiClient.put(`/tenants/${id}/modules`, data);
    return response.data;
  },

  uploadLogo: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/tenants/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteLogo: async (id) => {
    const response = await apiClient.delete(`/tenants/${id}/logo`);
    return response.data;
  },
};



