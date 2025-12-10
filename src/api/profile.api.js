import apiClient from '../utils/apiClient';

export const profileApi = {
  getProfile: async () => {
    const response = await apiClient.get('/profile/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await apiClient.put('/profile/me/settings', data);
    return response.data;
  },

  setup2FA: async () => {
    const response = await apiClient.post('/profile/me/security/2fa/setup');
    return response.data;
  },

  verifyAndEnable2FA: async (code) => {
    const response = await apiClient.post('/profile/me/security/2fa/verify', { code });
    return response.data;
  },

  disable2FA: async (password) => {
    const response = await apiClient.post('/profile/me/security/2fa/disable', { password });
    return response.data;
  },

  regenerateRecoveryCodes: async (password) => {
    const response = await apiClient.post('/profile/me/security/2fa/recovery-codes/regenerate', { password });
    return response.data;
  },

  listDevices: async () => {
    const response = await apiClient.get('/profile/me/devices');
    return response.data;
  },

  revokeDevice: async (deviceId) => {
    const response = await apiClient.post(`/profile/me/devices/${deviceId}/revoke`);
    return response.data;
  },

  revokeAllDevices: async (password) => {
    const response = await apiClient.post('/profile/me/devices/revoke-all', { password });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/profile/me/password/change', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  listSessions: async () => {
    const response = await apiClient.get('/profile/me/sessions');
    return response.data;
  },

  revokeSession: async (token) => {
    const response = await apiClient.post('/profile/me/sessions/revoke', { token });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/profile/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await apiClient.delete('/profile/me/avatar');
    return response.data;
  },
};

