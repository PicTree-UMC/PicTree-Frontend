import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://tenma.store/api/v1',
  timeout: 10000,
  withCredentials: true,
});
