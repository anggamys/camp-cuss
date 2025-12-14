import api from '../api/axiosInstance';

export const acceptDriverOrder = async (orderId) => {
  const response = await api.post(`orders/${orderId}/accept`);

  return response.data;
};
