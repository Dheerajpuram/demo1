import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Unauthorized access');
    } else if (error.response?.status >= 500) {
      toast.error('Server error occurred');
    } else if (error.message === 'Network Error') {
      toast.error('Network connection error');
    }
    return Promise.reject(error);
  }
);

export default api;