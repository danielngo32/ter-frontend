import apiClient from '../utils/apiClient';

export const authApi = {
  checkEmailAvailable: async (email, exists = false) => {
    const response = await apiClient.post('/auth/check-email', { email, exists });
    return response.data;
  },

  registerStep1: async (data) => {
    const response = await apiClient.post('/auth/register/step1', data);
    return response.data;
  },

  registerStep2: async (data) => {
    const response = await apiClient.post('/auth/register/step2', data);
    return response.data;
  },

  registerStep3: async (data) => {
    const response = await apiClient.post('/auth/register/step3', data);
    return response.data;
  },

  registerStep4: async (data) => {
    const response = await apiClient.post('/auth/register/step4', data);
    return response.data;
  },

  resendRegistrationCode: async (email) => {
    const response = await apiClient.post('/auth/register/resend', { email });
    return response.data;
  },

  checkTenantSlug: async (slug) => {
    const response = await apiClient.post('/auth/tenant/check-slug', { slug });
    return response.data;
  },

  generateTenantSlug: async (name) => {
    const response = await apiClient.post('/auth/tenant/generate-slug', { name });
    return response.data;
  },

  login: async (data) => {
    const response = await apiClient.post('/auth/login', data, {
      skipAuthRefresh: true,
    });
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/token/refresh', {});
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/token/revoke', {});
  },

  requestPasswordReset: async (email, slug) => {
    const payload = { email };
    if (slug) {
      payload.slug = slug;
    }
    const response = await apiClient.post('/auth/password/forgot', payload);
    return response.data;
  },

  verifyCode: async (email, code, type) => {
    const response = await apiClient.post('/auth/verify-code', { email, code, type });
    return response.data;
  },

  resetPassword: async (email, code, newPassword) => {
    const response = await apiClient.post('/auth/password/reset', { email, code, newPassword });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  createQrChallenge: async (data = {}) => {
    const response = await apiClient.post('/auth/qr/challenge', data);
    return response.data;
  },

  pollQrChallenge: async (challengeId) => {
    const response = await apiClient.post('/auth/qr/poll', { challengeId });
    return response.data;
  },
};
