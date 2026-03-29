import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { MapUserLocation } from '../types';

interface UseUserLocationResult {
  userLocation: MapUserLocation | null;
  isLocating: boolean;
  locationError: string | null;
  requestUserLocation: () => Promise<MapUserLocation | null>;
}

export function useUserLocation(): UseUserLocationResult {
  const [userLocation, setUserLocation] = useState<MapUserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestUserLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not available in this browser.');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
          });
        });

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setUserLocation(location);
        return location;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Location access is needed for near-me mode.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setUserLocation(location);
      return location;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not get your location right now.';
      setLocationError(message);
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return {
    userLocation,
    isLocating,
    locationError,
    requestUserLocation,
  };
}