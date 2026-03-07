// API Configuration
// Determine the API base URL based on environment
const getApiBaseUrl = (): string => {
  // Use environment variable if available (check both naming conventions)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // Development: use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }

  // Production: use deployed backend URL 
  return 'https://secure-file-backend-98yd.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = API_BASE_URL.replace('/api', ''); // For non-API routes if needed
