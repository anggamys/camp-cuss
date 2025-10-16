import api from './axiosInstance';

export const updateProfile = async (userId, data) => {
  const res = await api.patch(`/users/${userId}`, data);
  return res.data.data;
};
