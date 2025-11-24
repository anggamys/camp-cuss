import api from './axiosInstance';

export const getAllDestinations = async () => {
  const response = await api.get('/destinations');
  return response.data.data.data;
};
