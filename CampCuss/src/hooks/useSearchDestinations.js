// src/hooks/useSearchDestinations.js
import {useState, useEffect, useCallback} from 'react';
import {getAllDestinations} from '../api/destinationApi';
import {calculateDistance} from '../utils/distance';

export const useSearchDestinations = (
  userLatitude,
  userLongitude,
  radiusKm = 3,
) => {
  const [allDestinations, setAllDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterDestinations = useCallback(
    (query = '') => {
      if (
        userLatitude == null ||
        userLongitude == null ||
        !Array.isArray(allDestinations)
      ) {
        setFilteredDestinations([]);
        return;
      }

      const results = allDestinations.filter(dest => {

        const distance = calculateDistance(
          userLatitude,
          userLongitude,
          -7.332303,
          112.788273,
        );

        // ✅ Gunakan radiusKm yang dikirim
        const inRadius = distance <= radiusKm;

        if (!inRadius) {
          return false;
        }

        if (query.trim()) {
          return dest.name?.toLowerCase().includes(query.toLowerCase());
        }

        return true;
      });

      setFilteredDestinations(results);
    },
    [userLatitude, userLongitude, allDestinations, radiusKm],
  );

  useEffect(() => {
    if (userLatitude == null || userLongitude == null) {
      setLoading(false);
      return;
    }

    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const data = await getAllDestinations();

        if (!Array.isArray(data)) {
          setAllDestinations([]);
          setError('Format data destinasi tidak valid.');
          return;
        }

        setAllDestinations(data);
      } catch (err) {
        setError('Gagal memuat destinasi.');
        setAllDestinations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [userLatitude, userLongitude]);

  useEffect(() => {
    filterDestinations();
  }, [filterDestinations]);

  const search = query => {
    filterDestinations(query);
  };

  return {
    destinations: filteredDestinations,
    loading,
    error,
    search,
  };
};
