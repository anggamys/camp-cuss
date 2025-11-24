import {useState} from 'react';
import {notifAccountDriver} from '../api/notifApi';

export const useNotification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');

  const requestDriver = async userNotes => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Import API di sini atau gunakan dari file lain
      const response = await notifAccountDriver(userNotes);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setData(response.data);
      setMsg(response.message);
    } catch (err) {
      setError(err.message || 'Gagal mengirim permintaan driver');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return {
    loading,
    error,
    data,
    msg,
    requestDriver,
    reset,
  };
};
