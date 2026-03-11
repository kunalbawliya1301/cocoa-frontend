const rawBackend = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

// Supports accidental comma-separated values by taking the first valid URL.
const normalizedBackend = rawBackend
  .split(",")
  .map((entry) => entry.trim())
  .find(Boolean) || "http://localhost:8000";

export const BACKEND_URL = normalizedBackend.replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;
export const ORDER_WS_URL = BACKEND_URL.replace(/^http/i, "ws") + "/api/ws/orders";
