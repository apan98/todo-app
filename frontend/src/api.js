import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,
});

// Interceptor to add CSRF token to requests
api.interceptors.request.use(
  (config) => {
    const csrfToken = Cookies.get("csrf-token");
    if (config.method !== 'get' && config.method !== 'options' && config.method !== 'head') {
        if (csrfToken) {
            config.headers["X-CSRF-Token"] = csrfToken;
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirect to login page if not already there
      if (window.location.pathname !== "/login") {
          window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
