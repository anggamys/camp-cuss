import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {jwtDecode} from 'jwt-decode';
import api from '../api/axiosInstance';
import {loginApi, registerApi} from '../api/authApi';
import {saveTokens, getTokens, removeTokens} from '../utils/tokenStorage';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fungsi ambil data profil user berdasarkan ID
  const fetchUserProfile = useCallback(async userId => {
    if (!userId) {
      console.warn('User ID tidak ditemukan, tidak bisa ambil profil.');
      return;
    }

    try {
      const response = await api.get(`/users/${userId}`);
      setProfile(response.data.data || response.data);
    } catch (e) {
      await removeTokens();
      setUser(null);
      setProfile(null);
    }
  }, []);

  // 🔹 Cek autentikasi saat aplikasi dimulai
  const checkAuth = useCallback(async () => {
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        const decoded = jwtDecode(tokens.accessToken);
        console.log('Decoded token:', decoded);
        setUser(decoded);
        await fetchUserProfile(decoded.sub);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fungsi login
  const login = async (username, password) => {
    setError(null);
    try {
      const res = await loginApi(username, password);

      if (res?.accessToken) {
        await saveTokens(res.accessToken, res.refreshToken);
        const decoded = jwtDecode(res.accessToken);
        setUser(decoded);
        await fetchUserProfile(decoded.sub);
        return decoded;
      } else {
        switch (res.msg) {
          case 'Validation failed':
            setError('Username dan Password wajib diisi.');
            break;
          case 'User not found':
            setError('Akun tidak ditemukan.');
            break;
          case 'Invalid credentials':
            setError('Password salah.');
            break;
          default:
            setError('Terjadi kesalahan saat login.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Gagal terhubung ke server.');
    }
    return null;
  };

  // 🔹 Fungsi register
  const register = async (username, email, password, npm, no_phone) => {
    try {
      const res = await registerApi(username, email, password, npm, no_phone);
      return res;
    } catch (err) {
      throw err;
    }
  };

  // 🔹 Fungsi logout
  const logout = async () => {
    await removeTokens();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        setProfile,
        error,
        setError,
        login,
        register,
        logout,
        loading,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
