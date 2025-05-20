import { useCallback, useState } from "react";

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Thêm tính năng lưu và lấy vị trí từ localStorage
  const loadSavedLocation = useCallback(() => {
    try {
      const saved = localStorage.getItem("user-coordinates");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCoordinates(parsed);
        return true;
      }
    } catch (e) {
      console.error("Failed to load saved location", e);
    }
    return false;
  }, []);

  const saveLocation = useCallback((coords: [number, number]) => {
    try {
      localStorage.setItem("user-coordinates", JSON.stringify(coords));
    } catch (e) {
      console.error("Failed to save location", e);
    }
  }, []);

  // Cập nhật getLocation để lưu vị trí
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ Geolocation");
      return;
    }

    // Thử load vị trí đã lưu trước
    const hasSavedLocation = loadSavedLocation();
    if (hasSavedLocation) {
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setCoordinates(coords);
        saveLocation(coords);
        setLoading(false);
      },
      (err) => {
        setError(`Không thể lấy vị trí: ${err.message}`);
        setLoading(false);
      },
      { maximumAge: 60000, timeout: 5000, enableHighAccuracy: false }
    );
  }, [loadSavedLocation, saveLocation]);

  return { coordinates, error, loading, getLocation };
}
