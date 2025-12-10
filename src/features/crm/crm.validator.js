export const crmValidator = {
  validatePhone: (phone) => {
    if (!phone || typeof phone !== 'string') return true; // Optional field
    const cleaned = phone.trim().replace(/\D/g, ''); // Remove non-digits
    return cleaned.length >= 9;
  },
  
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return true; // Optional field
    const trimmed = email.trim();
    if (!trimmed) return true; // Empty is valid (optional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  },
  
  validateCustomerForm: (data, t) => {
    const errors = {};
    const name = data.name?.trim();
    if (!name) {
      errors.name = t?.('errors.nameRequired') || 'Name is required';
    }
    
    if (data.phone1 && !crmValidator.validatePhone(data.phone1)) {
      errors.phone1 = t?.('errors.phoneInvalid') || 'Phone must be at least 9 digits';
    }
    if (data.phone2 && !crmValidator.validatePhone(data.phone2)) {
      errors.phone2 = t?.('errors.phoneInvalid') || 'Phone must be at least 9 digits';
    }
    if (data.email1 && !crmValidator.validateEmail(data.email1)) {
      errors.email1 = t?.('errors.emailInvalid') || 'Email is invalid';
    }
    if (data.email2 && !crmValidator.validateEmail(data.email2)) {
      errors.email2 = t?.('errors.emailInvalid') || 'Email is invalid';
    }
    
    return errors;
  },
};

