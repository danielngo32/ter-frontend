import { aiApi } from '../../api/ai.api';

export const aiService = {
  chat: (data) => aiApi.chat(data),
  streamChat: (data) => aiApi.streamChat(data),
  transcribe: (audioFile, options) => aiApi.transcribe(audioFile, options),
  textToSpeech: (data) => aiApi.textToSpeech(data),
  createEmbeddings: (data) => aiApi.createEmbeddings(data),
  listChats: (params) => aiApi.listChats(params),
  getChat: (id) => aiApi.getChat(id),
  deleteChat: (id) => aiApi.deleteChat(id),
  getAvailableVoices: () => aiApi.getAvailableVoices(),
};

