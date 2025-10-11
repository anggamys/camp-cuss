import axios from 'axios';

const API_URL = 'https://radical-shay-sandboxdevlab-4db51ee1.koyeb.app/v1';

// authApi.js
export const loginApi = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });

    if (response.data.status === 'success') {
      return {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        msg: 'Login success',
      };
    } else {
      return { msg: response.data.message || 'Login gagal' };
    }
  } catch (error) {
    // Kirim balik pesan berdasarkan status
    if (error.response) {
      if (error.response.status === 404) {
        return { msg: 'User not found' };
      } else if (error.response.status === 401) {
        return { msg: 'Invalid credentials' };
      } else if (error.response.status === 422) {
        return { msg: 'Validation failed' };
      }
    }

    // Fallback error
    return { msg: 'Server error' };
  }
};

export const registerApi = async (username, email, password, npm, no_phone) => {
  try {
    const response = await axios.post(`${API_URL}/users`, {
      username,
      email,
      password,
      npm,
      no_phone,
    });
    if (response.data.status === 'success') {
      return response.data; // Kembalikan seluruh data respons
    }
    throw new Error(response.data.message || 'Registration failed');
  } catch (error) {
    console.error('Registration error:', error);
    throw error; // Lewatkan error agar bisa ditangani di komponen
  }
};

export const refreshTokenApi = async refreshToken => {
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    return data.data.accessToken;
  } catch {
    return null;
  }
};
