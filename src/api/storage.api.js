import apiClient from '../utils/apiClient';

export const storageApi = {
  listItems: async (parentId = null) => {
    const params = parentId ? { parentId } : {};
    const response = await apiClient.get('/storage', { params });
    return response.data;
  },

  listTrash: async () => {
    const response = await apiClient.get('/storage/trash');
    return response.data;
  },

  getItem: async (id) => {
    const response = await apiClient.get(`/storage/${id}`);
    return response.data;
  },

  createFolder: async (data) => {
    const response = await apiClient.post('/storage/folders', data);
    return response.data;
  },

  uploadFile: async (file, parentId = null, visibility = 'private', shares = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) formData.append('parentId', parentId);
    if (visibility) formData.append('visibility', visibility);
    if (shares) formData.append('shares', JSON.stringify(shares));

    const response = await apiClient.post('/storage/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateItem: async (id, data) => {
    const response = await apiClient.put(`/storage/${id}`, data);
    return response.data;
  },

  shareItem: async (id, data) => {
    const response = await apiClient.put(`/storage/${id}/share`, data);
    return response.data;
  },

  moveToTrash: async (id) => {
    const response = await apiClient.post(`/storage/${id}/trash`);
    return response.data;
  },

  restoreFromTrash: async (id) => {
    const response = await apiClient.post(`/storage/${id}/restore`);
    return response.data;
  },

  deletePermanently: async (id) => {
    const response = await apiClient.delete(`/storage/${id}`);
    return response.data;
  },
};



