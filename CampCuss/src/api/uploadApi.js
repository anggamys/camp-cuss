import api from './axiosInstance';

// Endpoint dinamis berdasarkan tipe dokumen
export const uploadDocument = async (userId, uri, docType) => {
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    type: 'image/jpeg',
    name: `${docType}.jpg`,
  });

  // Contoh endpoint: /storages/users/123/upload/ktp
  const response = await api.post(
    `/storages/users/${userId}/upload/${docType}`,
    formData,
    {
      headers: {'Content-Type': 'multipart/form-data'},
    },
  );

  return response.data.data;
};
