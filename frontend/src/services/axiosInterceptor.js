import axios from 'axios';
import { toast } from 'react-toastify';

const setupAxiosInterceptors = (logoutUser) => {
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        logoutUser();
        toast.error("Your session has expired. Please log in again.");
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
