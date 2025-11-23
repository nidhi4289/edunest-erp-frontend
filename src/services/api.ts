import axios from "axios";


const baseURL = import.meta.env.VITE_API_URL || "https://syb57fzgqb.execute-api.ap-south-1.amazonaws.com/pd";

export const api = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 seconds default timeout
});

// Attach Bearer token on every request
api.interceptors.request.use((config) => {
  console.log('🚀 API Request Starting:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    headers: config.headers,
    data: config.data
  });
  
  const token = localStorage.getItem("authToken"); // Changed from "token" to "authToken"
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Added auth token to request');
  } else {
    console.log('⚠️ No auth token found');
  }
  return config;
});

// Add response interceptor for detailed error logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      fullError: error
    });
    
    // More specific error logging
    if (!error.response) {
      console.error('🌐 Network Error - Cannot reach backend server');
      console.error('🔍 Check if backend is running and accessible at:', error.config?.baseURL);
    } else if (error.response.status >= 500) {
      console.error('🔥 Server Error - Backend returned 5xx status');
    } else if (error.response.status >= 400) {
      console.error('🚫 Client Error - Request rejected by backend');
    }
    
    return Promise.reject(error);
  }
);

// optional debug: see baseURL & whether we had a token
console.log("API baseURL is:", api.defaults.baseURL);