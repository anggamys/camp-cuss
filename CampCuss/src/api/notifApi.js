import api from './axiosInstance';

export const notifAccountDriver = async (data) => {
  const res = await api.post('/users/request-driver', data);
  return res;
};
