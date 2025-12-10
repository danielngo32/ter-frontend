import apiClient from '../utils/apiClient';

export const aiApi = {
  chat: async (data) => {
    const response = await apiClient.post('/ai/chat', data);
    return response.data;
  },

  streamChat: async (data) => {
    const response = await apiClient.post('/ai/chat/stream', data);
    return response.data;
  },

  transcribe: async (audioFile, options = {}) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (options.language) formData.append('language', options.language);
    if (options.prompt) formData.append('prompt', options.prompt);
    if (options.model) formData.append('model', options.model);

    const response = await apiClient.post('/ai/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  textToSpeech: async (data) => {
    const response = await apiClient.post('/ai/tts', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  createEmbeddings: async (data) => {
    const response = await apiClient.post('/ai/embeddings', data);
    return response.data;
  },

  listChats: async (params = {}) => {
    const response = await apiClient.get('/ai/chats', { params });
    return response.data;
  },

  getChat: async (id) => {
    const response = await apiClient.get(`/ai/chats/${id}`);
    return response.data;
  },

  deleteChat: async (id) => {
    const response = await apiClient.delete(`/ai/chats/${id}`);
    return response.data;
  },

  getAvailableVoices: async () => {
    const response = await apiClient.get('/ai/voices');
    return response.data;
  },
};

