import api from './axiosInstance';

export const getAllDestinations = async () => {
  const response = await api.get('/destinations');
  return response.data.data.data;
};

export const getByIdDestination = async id => {
  const response = await api.get(`/destinations/${id}`);
  return response.data.data;
};
