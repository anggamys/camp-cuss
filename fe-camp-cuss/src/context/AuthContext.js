// src/context/AuthProvider.js
import React, { createContext, useState, useEffect, useContext, use } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosInstance';
import { loginApi, registerApi } from '../api/authApi';
import { saveTokens, getTokens, removeTokens } from '../utils/tokenStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil data user lengkap dari API — perlu userId
  const fetchUserProfile = async userId => {
    if (!userId) return;
    try {
      const response = await api.get(`/users/${userId}`);
      setProfile(response.data.data);
    } catch (err) {
      console.warn('Failed to fetch profile, clearing session');
      await removeTokens();
      setUser(null);
    }
  };

  const checkAuth = async () => {
    const { accessToken } = await getTokens();

    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          await fetchUserProfile(decoded.id);
        } else {
          await fetchUserProfile(decoded.id);
          setUser({ ...decoded, id: decoded.id, role: decoded.role });
        }
      } catch (err) {
        console.error('JWT decode error:', err);
        await removeTokens();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    setError('');

    try {
      const res = await loginApi(username, password);

      if (res?.accessToken) {
        await saveTokens(res.accessToken, res.refreshToken);
        const decoded = jwtDecode(res.accessToken);
        setUser(decoded);
        return decoded;
      } else {
        if (res.msg === 'Validation failed')
          setError('Username dan Password wajib diisi.');
        else if (res.msg === 'User not found')
          setError('Akun tidak ditemukan.');
        else if (res.msg === 'Invalid credentials') setError('Password salah.');
        else setError('Terjadi kesalahan saat login.');
      }
    } catch (err) {
      setError('Gagal terhubung ke server.');
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
    navigationRef.current?.navigate('Auth');
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, setProfile, error, setError, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
