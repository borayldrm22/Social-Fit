// Use 127.0.0.1 so simulator/device can load images from same host as API
export const API_BASE = __DEV__
  ? 'http://127.0.0.1:4000'
  : 'https://your-api.socialfit.com';
