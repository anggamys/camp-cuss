 
import axios from "axios";

const API_URL = "https://dummyjson.com/auth";

export const loginApi = async (username, password) => {
  try {
    const { data } = await axios.post(`${API_URL}/login`, { username, password });
    return data; // { accessToken, refreshToken }
  } catch {
    return null;
  }
};

export const refreshTokenApi = async (refreshToken) => {
  try {
    const { data } = await axios.post(`${API_URL}/refresh`, { refreshToken });
    return data.accessToken;
  } catch {
    return null;
  }
};
