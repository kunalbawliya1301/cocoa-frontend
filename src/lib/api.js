import axios from "axios";

const rawBackend = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

// Supports accidental comma-separated values by taking the first valid URL.
const normalizedBackend = rawBackend
  .split(",")
  .map((entry) => entry.trim())
  .find(Boolean) || "http://localhost:8000";

export const BACKEND_URL = normalizedBackend.replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;
export const ORDER_WS_URL = BACKEND_URL.replace(/^http/i, "ws") + "/api/ws/orders";

export const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
