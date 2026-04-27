import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState({ lat: null, lng: null, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(s => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null
        });
      },
      (err) => {
        setLocation(s => ({ ...s, error: err.message }));
      }
    );
  }, []);

  return location;
};
