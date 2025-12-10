export const profileValidator = {
  fullName: (rule, value) => {
    if (!value || !value.trim()) {
      return Promise.reject('Full name is required');
    }
    if (value.trim().length < 1) {
      return Promise.reject('Full name must be at least 1 character');
    }
    if (value.trim().length > 120) {
      return Promise.reject('Full name must be less than 120 characters');
    }
    return Promise.resolve();
  },

  phoneNumber: (rule, value) => {
    if (value && value.trim()) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(value.trim())) {
        return Promise.reject('Please enter a valid phone number');
      }
      if (value.trim().length < 6 || value.trim().length > 20) {
        return Promise.reject('Phone number must be between 6 and 20 characters');
      }
    }
    return Promise.resolve();
  },

  avatarUrl: (rule, value) => {
    if (value && value.trim()) {
      try {
        new URL(value.trim());
      } catch {
        return Promise.reject('Please enter a valid URL');
      }
    }
    return Promise.resolve();
  },

  gender: (rule, value) => {
    if (value && !['male', 'female'].includes(value)) {
      return Promise.reject('Please select a valid gender');
    }
    return Promise.resolve();
  },

  dateOfBirth: (rule, value) => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return Promise.reject('Please enter a valid date');
      }
      if (date > new Date()) {
        return Promise.reject('Date of birth cannot be in the future');
      }
    }
    return Promise.resolve();
  },

  address: (rule, value) => {
    if (value && value.trim().length > 500) {
      return Promise.reject('Address must be less than 500 characters');
    }
    return Promise.resolve();
  },
};

