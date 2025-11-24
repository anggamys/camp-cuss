import api from '../api/axiosInstance';

export const createOrder = async orderData => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrderStatus = async orderId => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const getListOrder = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderById = async orderId => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async orderId => {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
};

// Optional: Jika endpoint cancel berbeda
export const cancelOrderAlternative = async orderId => {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
};
