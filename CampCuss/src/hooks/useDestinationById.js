// src/hooks/useDestinationById.js
import {useState, useEffect} from 'react';
import {getByIdDestination} from '../api/destinationApi';

export const useDestinationById = destinationId => {
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!destinationId) {
      setLoading(false);
      return;
    }

    const fetchDestination = async () => {
      try {
        setLoading(true);
        const data = await getByIdDestination(destinationId);
        setDestination(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching destination:', err);
        setError(err.message || 'Failed to fetch destination');
        setDestination(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDestination();
  }, [destinationId]);

  return {destination, loading, error};
};
