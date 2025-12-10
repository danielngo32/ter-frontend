export const aiValidator = {
  validateChatMessage: (message) => {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return 'Message cannot be empty';
    }
    if (message.length > 10000) {
      return 'Message is too long (max 10000 characters)';
    }
    return null;
  },

  validateTTS: (text) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return 'Text is required';
    }
    if (text.length > 4096) {
      return 'Text is too long (max 4096 characters)';
    }
    return null;
  },
};

