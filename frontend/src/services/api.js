import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_URL = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.0.172:8000';
const API_BASE_URL = ENV_API_URL || DEFAULT_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token JWT do AsyncStorage em requisições privadas
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@giralivro:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Erro ao carregar token do AsyncStorage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
