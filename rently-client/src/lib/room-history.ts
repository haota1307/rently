const ROOM_HISTORY_KEY = "room-viewing-history";
const MAX_HISTORY_SIZE = 10; // Lưu tối đa 10 phòng gần đây

export interface RoomHistoryItem {
  roomId: number;
  timestamp: number;
  title?: string;
}

// Lưu phòng vào lịch sử xem
export const saveRoomToHistory = (roomId: number, title?: string) => {
  if (typeof window === "undefined") return;

  try {
    const history = getRoomHistory();

    // Loại bỏ phòng cũ nếu đã tồn tại
    const filteredHistory = history.filter((item) => item.roomId !== roomId);

    // Thêm phòng mới vào đầu danh sách
    const newHistory: RoomHistoryItem[] = [
      {
        roomId,
        timestamp: Date.now(),
        title,
      },
      ...filteredHistory,
    ].slice(0, MAX_HISTORY_SIZE); // Giới hạn số lượng

    localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.warn("Failed to save room to history:", error);
  }
};

// Lấy lịch sử xem phòng
export const getRoomHistory = (): RoomHistoryItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const history = localStorage.getItem(ROOM_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn("Failed to get room history:", error);
    return [];
  }
};

// Lấy phòng được xem gần đây nhất
export const getLastViewedRoomId = (): number | null => {
  const history = getRoomHistory();
  return history.length > 0 ? history[0].roomId : null;
};

// Lấy phòng ngẫu nhiên từ lịch sử (để đa dạng hóa gợi ý)
export const getRandomViewedRoomId = (): number | null => {
  const history = getRoomHistory();
  if (history.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * Math.min(history.length, 5)); // Chọn từ 5 phòng gần đây nhất
  return history[randomIndex].roomId;
};

// Xóa lịch sử xem phòng
export const clearRoomHistory = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ROOM_HISTORY_KEY);
  } catch (error) {
    console.warn("Failed to clear room history:", error);
  }
};

// Lấy roomId thông minh cho recommendations
export const getSmartRecommendationRoomId = (): number => {
  // Ưu tiên: phòng được xem gần đây nhất
  const lastViewedId = getLastViewedRoomId();
  if (lastViewedId) return lastViewedId;

  // Fallback: roomId mặc định
  return 1;
};
