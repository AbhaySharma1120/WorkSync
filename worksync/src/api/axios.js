import axios from "axios";

// ========================================
// API BASE URL
// ========================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ========================================
// AXIOS INSTANCE
// ========================================

const api = axios.create({
  baseURL: API_URL,
});

// ========================================
// ADD JWT TOKEN TO REQUESTS
// ========================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
