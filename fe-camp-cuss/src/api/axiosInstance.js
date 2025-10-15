import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  removeTokens,
} from '../utils/tokenStorage';
import jwtDecode from 'jwt-decode';

const API_URL = 'https://radical-shay-sandboxdevlab-4db51ee1.koyeb.app/v1';

const api = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async config => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('Tidak ada token penyegaran');

        const now = Date.now() / 1000;
        const decoded = jwtDecode(refreshToken);
        if (decoded.exp > now) {
          await removeTokens();
          authEmitter.emit('logout');
          navigationRef.current?.navigate('Auth');
          return;
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data.data.access_token;
        await saveTokens(access_token, refreshToken);

        isRefreshing = false;
        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        await removeTokens();
        navigationRef.current?.navigate('Auth');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
