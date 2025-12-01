// src/hooks/useDestinationById.js
import {useState, useEffect} from 'react';
import {getByIdUser} from '../api/profileApi';

export const useUserById = userId => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDestination = async () => {
      try {
        setLoading(true);
        const data = await getByIdUser(userId);
        setUser(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching destination:', err);
        setError(err.message || 'Failed to fetch destination');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDestination();
  }, [userId]);

  return {user, loading, error};
};
