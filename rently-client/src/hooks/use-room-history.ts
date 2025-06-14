import { useState, useEffect, useCallback } from "react";
import {
  getRoomHistory,
  saveRoomToHistory,
  getLastViewedRoomId,
  getRandomViewedRoomId,
  clearRoomHistory,
  getSmartRecommendationRoomId,
  type RoomHistoryItem,
} from "@/lib/room-history";

export const useRoomHistory = () => {
  const [history, setHistory] = useState<RoomHistoryItem[]>([]);
  const [lastViewedRoomId, setLastViewedRoomId] = useState<number | null>(null);

  // Load history on mount
  useEffect(() => {
    const loadHistory = () => {
      const currentHistory = getRoomHistory();
      setHistory(currentHistory);
      setLastViewedRoomId(getLastViewedRoomId());
    };

    loadHistory();

    // Listen for storage changes (if user opens multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "room-viewing-history") {
        loadHistory();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addToHistory = useCallback((roomId: number, title?: string) => {
    saveRoomToHistory(roomId, title);
    // Update local state
    const newHistory = getRoomHistory();
    setHistory(newHistory);
    setLastViewedRoomId(roomId);
  }, []);

  const clearHistory = useCallback(() => {
    clearRoomHistory();
    setHistory([]);
    setLastViewedRoomId(null);
  }, []);

  const getSmartRoomId = useCallback(() => {
    return getSmartRecommendationRoomId();
  }, []);

  const getRandomRoomId = useCallback(() => {
    return getRandomViewedRoomId();
  }, []);

  return {
    history,
    lastViewedRoomId,
    addToHistory,
    clearHistory,
    getSmartRoomId,
    getRandomRoomId,
    hasHistory: history.length > 0,
  };
};
