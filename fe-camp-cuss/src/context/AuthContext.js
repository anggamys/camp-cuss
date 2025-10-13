// src/context/AuthProvider.js
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginApi, registerApi, refreshTokenApi } from '../api/authApi';
import {saveTokens, getTokens, removeTokens} from '../utils/tokenStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek auth saat app dibuka
  const checkAuth = async () => {
    const { accessToken, refreshToken } = await getTokens();

    if (accessToken) {
      const decoded = jwtDecode(accessToken);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        // Token expired → coba refresh
        if (refreshToken) {
          const newAccessToken = await refreshTokenApi(refreshToken);
          if (newAccessToken) {
            await saveTokens(newAccessToken, refreshToken);
            setUser(jwtDecode(newAccessToken));
          } else {
            // Refresh gagal → logout
            await removeTokens();
            setUser(null);
          }
        } else {
          await removeTokens();
          setUser(null);
        }
      } else {
        // Token masih valid
        setUser(decoded);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    setError('');

    const res = await loginApi(username, password);

    if (res?.accessToken) {
      await saveTokens(res.accessToken, res.refreshToken);
      const decoded = jwtDecode(res.accessToken);
      setUser(decoded);
      return decoded;
    } else {
      // Tangani semua kemungkinan pesan error
      if (res.msg === 'Validation failed')
        setError('Username dan Password wajib diisi.');
      else if (res.msg === 'User not found') setError('Akun tidak ditemukan.');
      else if (res.msg === 'Invalid credentials') setError('Password salah.');
      else setError('Terjadi kesalahan saat login.');
    }

    return null;
  };

  const register = async (username, email, password, npm, no_phone) => {
    try {
      const res = await registerApi(username, email, password, npm, no_phone);
      return res;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await removeTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, error, setError, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
