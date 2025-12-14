import api from './axiosInstance';

export const updateProfile = async (userId, data) => {
  const res = await api.patch(`/users/${userId}`, data);
  return res.data.data;
};

export const getByIdUser = async userId => {
  const res = await api.get(`/users/${userId}`);
  return res.data.data;
};

export const uploadProfilePhoto = async (
  userId,
  uri,
  filename = 'photo-profile.jpg',
) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: filename,
  });

  const response = await api.post(
    `/storages/users/${userId}/upload/photo-profile`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
};
