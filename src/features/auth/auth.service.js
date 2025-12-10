import { authApi } from '../../api/auth.api';
import { systemApi } from '../../api/system.api';

// Safe fields to store in localStorage (exclude sensitive data like sessions, tokens)
const SAFE_USER_FIELDS = [
  '_id',
  'email',
  'fullName',
  'avatarUrl',
  'role',
  'tenantId',
  'tenantSlug',
  'status',
  'createdAt',
  'updatedAt',
  'lastLoginAt',
  'settings',
];

const sanitizeUserData = (user) => {
  if (!user) return null;
  
  const sanitized = {};
  SAFE_USER_FIELDS.forEach(field => {
    if (user[field] !== undefined) {
      sanitized[field] = user[field];
    }
  });
  
  // Add tenantSlug if provided separately
  return sanitized;
};

const persistAuthResponse = (response) => {
  if (response?.user) {
    // Sanitize user data - remove sensitive fields like sessions, tokens
    const sanitizedUser = sanitizeUserData(response.user);
      const userData = {
      ...sanitizedUser,
        ...(response.tenantSlug && { tenantSlug: response.tenantSlug }),
      };
      localStorage.setItem('user', JSON.stringify(userData));
    }
    if (response.tenantSlug) {
      localStorage.setItem('tenantSlug', response.tenantSlug);
  }
  return response;
};

export const authService = {
  checkEmailAvailable: async (email, exists = false) => {
    return await authApi.checkEmailAvailable(email, exists);
  },

  registerStep1: async (data) => {
    return await authApi.registerStep1(data);
  },

  registerStep2: async (data) => {
    return await authApi.registerStep2(data);
  },

  registerStep3: async (data) => {
    return await authApi.registerStep3(data);
  },

  registerStep4: async (data) => {
    const response = await authApi.registerStep4(data);
    return persistAuthResponse(response);
  },

  resendRegistrationCode: async (email) => {
    return await authApi.resendRegistrationCode(email);
  },

  checkTenantSlug: async (slug) => {
    return await authApi.checkTenantSlug(slug);
  },

  generateTenantSlug: async (name) => {
    return await authApi.generateTenantSlug(name);
  },

  getBusinessCategories: async () => {
    const response = await systemApi.getBusinessCategories();
    return response.data || [];
  },

  getParentBusinessCategories: async () => {
    const response = await systemApi.getParentBusinessCategories();
    return response.data || [];
  },

  getSubBusinessCategories: async (parentId) => {
    const response = await systemApi.getSubBusinessCategories(parentId);
    return response.data || [];
  },

  login: async (data) => {
    const response = await authApi.login(data);
    return persistAuthResponse(response);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('tenantSlug');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    const user = authService.getCurrentUser();
    return !!user;
  },

  requestPasswordReset: async (email, slug) => {
    return await authApi.requestPasswordReset(email, slug);
  },

  verifyCode: async (email, code, type) => {
    return await authApi.verifyCode(email, code, type);
  },

  resetPassword: async (email, code, newPassword) => {
    const response = await authApi.resetPassword(email, code, newPassword);
    return persistAuthResponse(response);
  },

  getProfile: async () => {
    const response = await authApi.getProfile();
    if (response) {
      // Sanitize user data before storing in localStorage
      const sanitizedUser = sanitizeUserData(response);
      localStorage.setItem('user', JSON.stringify(sanitizedUser));
    }
    return response;
  },

  createQrChallenge: async (payload = {}) => {
    return authApi.createQrChallenge(payload);
  },

  pollQrChallenge: async (challengeId) => {
    const response = await authApi.pollQrChallenge(challengeId);
    if (response?.status === 'approved') {
      persistAuthResponse(response);
    }
    return response;
  },
};
