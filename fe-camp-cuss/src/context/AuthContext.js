import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwtDecode from "jwt-decode";
import { loginApi, refreshTokenApi } from "../api/authApi";
import { getToken, setToken, clearToken } from "../utils/tokenStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const { accessToken, refreshToken } = await getToken();

    if (accessToken) {
      const decoded = jwtDecode(accessToken);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        if (refreshToken) {
          const newAccess = await refreshTokenApi(refreshToken);
          if (newAccess) {
            await setToken({ accessToken: newAccess, refreshToken });
            setUser(jwtDecode(newAccess));
          } else {
            await clearToken();
          }
        } else {
          await clearToken();
        }
      } else {
        setUser(decoded);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await loginApi(username, password);
    if (res) {
      const decoded = jwtDecode(res.accessToken);
      await setToken(res);
      setUser(decoded);
      return decoded;
    }
    return null;
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
