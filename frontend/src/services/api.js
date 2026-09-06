import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.172:8000';

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
      console.warn('Erro ao carregar token do AsyncStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
