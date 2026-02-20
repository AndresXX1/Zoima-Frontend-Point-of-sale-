// utils/api.js
const API_URL = 'http://localhost:3000';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include', // 👈 ESTO ES CRUCIAL - envía las cookies
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  return response;
};