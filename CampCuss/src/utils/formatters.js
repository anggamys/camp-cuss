// src/utils/formatters.js
export const getStatusText = status => {
  const statusMap = {
    accepted: 'Diterima',
    pending: 'Menunggu',
    on_the_way: 'Dalam Perjalanan',
    picked_up: 'Penumpang Diambil',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return statusMap[status] || status;
};

export const getPaymentStatusText = status => {
  const statusMap = {
    pending: 'Belum Bayar',
    paid: 'Sudah Bayar',
    failed: 'Gagal Bayar',
  };
  return statusMap[status] || status;
};

export const formatPrice = price => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(price || 0);
};

export const formatDateTime = dateString => {
  if (!dateString) {
    return '—';
  }
  return new Date(dateString).toLocaleString('id-ID');
};
