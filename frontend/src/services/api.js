import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  // We are now using httpOnly cookies for the token, so we don't need to set it here.
  // The browser will automatically send the cookie with each request.
  return config;
}, error => {
  toast.error("Error sending request.");
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response) {
    if (error.response.status === 401) {
      // Cookies are managed by the browser, so we just need to redirect
      window.location = '/login';
      toast.error("Session expired. Please log in again.");
    } else {
      const message = error.response.data.message || "An error occurred.";
      toast.error(message);
    }
  } else {
    toast.error("Network error. Please try again later.");
  }
  return Promise.reject(error);
});

export default api;
