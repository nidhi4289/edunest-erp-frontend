import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5199",
});

// Attach Bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // Changed from "token" to "authToken"
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// optional debug: see baseURL & whether we had a token
console.log("API baseURL:", api.defaults.baseURL);