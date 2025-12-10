import { crmApi } from '../../api/crm.api';
import { systemApi } from '../../api/system.api';

export const crmService = {
  listCustomers: (params) => crmApi.listCustomers(params),
  getCustomerById: (id) => crmApi.getCustomerById(id),
  createCustomer: (data, files) => crmApi.createCustomer(data, files),
  updateCustomer: (id, data, files) => crmApi.updateCustomer(id, data, files),
  deleteCustomer: (id) => crmApi.deleteCustomer(id),
  deleteCustomersBulk: (ids) => crmApi.deleteCustomersBulk(ids),
  exportCustomers: (params) => crmApi.exportCustomers(params),
  importCustomers: (file, options) => crmApi.importCustomers(file, options),
  downloadSampleFile: () => crmApi.downloadSampleFile(),
  getProvinces: () => systemApi.getProvinces(),
  getWards: (provinceCode, provinceId) => systemApi.getWards(provinceCode, provinceId),
};

