import { profileApi } from '../../api/profile.api';

const updateLocalStorageUser = (userData) => {
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
  return userData;
};

export const profileService = {
  getProfile: async () => {
    const response = await profileApi.getProfile();
    return updateLocalStorageUser(response);
  },

  updateProfile: async (data) => {
    const response = await profileApi.updateProfile(data);
    return updateLocalStorageUser(response);
  },

  updateSettings: async (data) => {
    const response = await profileApi.updateSettings(data);
    return updateLocalStorageUser(response);
  },

  setup2FA: async () => {
    return await profileApi.setup2FA();
  },

  verifyAndEnable2FA: async (code) => {
    return await profileApi.verifyAndEnable2FA(code);
  },

  disable2FA: async (password) => {
    return await profileApi.disable2FA(password);
  },

  regenerateRecoveryCodes: async (password) => {
    return await profileApi.regenerateRecoveryCodes(password);
  },

  listDevices: async () => {
    const response = await profileApi.listDevices();
    return response.data || [];
  },

  revokeDevice: async (deviceId) => {
    return await profileApi.revokeDevice(deviceId);
  },

  revokeAllDevices: async (password) => {
    return await profileApi.revokeAllDevices(password);
  },

  changePassword: async (currentPassword, newPassword) => {
    return await profileApi.changePassword(currentPassword, newPassword);
  },

  listSessions: async () => {
    const response = await profileApi.listSessions();
    return response.data || [];
  },

  revokeSession: async (token) => {
    return await profileApi.revokeSession(token);
  },

  uploadAvatar: async (file) => {
    const response = await profileApi.uploadAvatar(file);
    if (response.url) {
      const user = profileService.getCurrentUser();
      if (user) {
        user.avatarUrl = response.url;
        updateLocalStorageUser(user);
      }
    }
    return response;
  },

  deleteAvatar: async () => {
    const response = await profileApi.deleteAvatar();
    const user = profileService.getCurrentUser();
    if (user) {
      user.avatarUrl = null;
      updateLocalStorageUser(user);
    }
    return response;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isOwner: () => {
    const user = profileService.getCurrentUser();
    return user?.role === 'owner';
  },
};

