import apiClient from '../utils/apiClient';

const normalizeColumns = (columns) => {
  if (!columns) return undefined;
  if (Array.isArray(columns)) return columns.join(',');
  return columns;
};

export const crmApi = {
  listCustomers: async (params = {}) => {
    const response = await apiClient.get('/crm/customers', { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await apiClient.get(`/crm/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data, files = {}) => {
    const formData = new FormData();
    appendCustomerFormData(formData, data, files);
    const response = await apiClient.post('/crm/customers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateCustomer: async (id, data, files = {}) => {
    const formData = new FormData();
    appendCustomerFormData(formData, data, files);
    const response = await apiClient.put(`/crm/customers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await apiClient.delete(`/crm/customers/${id}`);
    return response.data;
  },

  deleteCustomersBulk: async (ids) => {
    const response = await apiClient.delete('/crm/customers', { data: { ids } });
    return response.data;
  },

  exportCustomers: async (params = {}) => {
    const { columns, filters } = params;
    const query = {};
    if (columns) query.columns = normalizeColumns(columns);
    if (filters && Array.isArray(filters) && filters.length > 0) {
      query.filters = JSON.stringify(filters);
    }
    const response = await apiClient.get('/crm/customers/export', {
      params: query,
      responseType: 'blob',
    });
    return response;
  },

  importCustomers: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.mode) formData.append('mode', options.mode);
    if (options.duplicateCodeAction) formData.append('duplicateCodeAction', options.duplicateCodeAction);
    if (options.duplicateContactAction) formData.append('duplicateContactAction', options.duplicateContactAction);

    const response = await apiClient.post('/crm/customers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadSampleFile: async () => {
    const response = await apiClient.get('/crm/customers/import/sample', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers-import-sample.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

const appendCustomerFormData = (formData, data = {}, files = {}) => {
  const { address, ...rest } = data || {};
  Object.entries(rest).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, value);
  });

  if (address && Object.values(address).some((v) => v)) {
    formData.append('address', JSON.stringify(address));
  }

  if (files.avatar instanceof File) {
    formData.append('avatar', files.avatar);
  }
};

