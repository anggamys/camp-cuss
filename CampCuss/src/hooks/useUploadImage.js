// src/hooks/useUploadImage.js
import {useState} from 'react';
import {uploadDocument} from '../api/uploadApi';

export const useUploadImage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Upload dokumen ke server
   * @param {string} userId - ID user
   * @param {string} uri - URI lokal gambar
   * @param {string} docType - Tipe dokumen ('ktp', 'sim', 'stnk', dll)
   * @returns {string} URL gambar yang diupload
   */
  const upload = async (userId, uri, docType) => {
    setUploading(true);
    setError(null);
    try {
      // ✅ Gunakan docType, bukan filename
      const url = await uploadDocument(userId, uri, docType);
      setUploadedUrl(url);
      return url;
    } catch (err) {
      const message = err.message || 'Gagal mengupload dokumen';
      setError(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  // Reset state setelah upload selesai (opsional)
  const reset = () => {
    setUploadedUrl(null);
    setError(null);
  };

  return {
    uploading,
    uploadedUrl,
    error,
    upload,
    reset,
  };
};
