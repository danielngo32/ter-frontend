import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL;

let socketInstance = null;

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};


const getWebSocketUrl = () => {
  if (!API_BASE_URL) return '';
  
  let url = API_BASE_URL.replace(/\/api\/?$/, '');
  
  return url;
};

export const createSocketConnection = (token = null) => {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  const authToken = token || getCookie('accessToken');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Available cookies:', document.cookie);
    console.log('AccessToken from cookie:', authToken ? 'Found' : 'Not found');
  }

  const config = {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    withCredentials: true,
  };

  if (authToken) {
    config.auth = {
      token: authToken,
    };
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('No token provided, backend will try to read from cookies');
    }
  }

  const wsUrl = getWebSocketUrl();
  socketInstance = io(wsUrl, config);

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const getSocketInstance = () => {
  return socketInstance;
};

