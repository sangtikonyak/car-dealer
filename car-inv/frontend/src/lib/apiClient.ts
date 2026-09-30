import axios from 'axios';
import { frontendEnvironment } from '../config/env';

export const apiClient = axios.create({
  baseURL: frontendEnvironment.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8_000,
  withCredentials: true,
});
