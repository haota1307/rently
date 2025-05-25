import http from "@/lib/http";

export interface StatisticsOverview {
  totalRentals: number;
  totalRooms: number;
  totalPosts: number;
  accountBalance: number;
  percentageChanges: {
    rentals: number;
    rooms: number;
    posts: number;
    balance: number;
  };
}

export interface RevenueDataPoint {
  name: string;
  nạp?: number;
  rút?: number;
  "đặt cọc"?: number;
  "phí đăng bài"?: number;
  "hoàn cọc"?: number;
  date: string;
}

export interface RoomDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AreaPostCount {
  name: string;
  posts: number;
}

export interface PopularArea {
  name: string;
  count: number;
  trend: string;
}

export const getStatisticsOverview = async () => {
  const { payload } = await http.get<StatisticsOverview>("statistics/overview");
  return payload;
};

export interface GetRevenueDataParams {
  days?: number;
  startDate?: string;
  endDate?: string;
  transaction_content?: string;
}

export const getRevenueData = async (
  days: number = 7,
  transaction_content?: string,
  startDate?: string,
  endDate?: string
) => {
  // Tạo URL cơ bản
  let url = `statistics/revenue?`;

  // Thêm các tham số
  const params = new URLSearchParams();

  // Luôn thêm days để đảm bảo tương thích với API cũ
  params.append("days", days.toString());

  // Nếu có startDate và endDate, thêm vào params
  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  if (transaction_content) {
    params.append("transaction_content", transaction_content);
  }

  const finalUrl = `statistics/revenue?${params.toString()}`;

  const { payload } = await http.get<RevenueDataPoint[]>(finalUrl);
  return payload;
};

export const getLandlordTransactionData = async (
  days: number = 7,
  startDate?: string,
  endDate?: string
) => {
  // Tạo các tham số
  const params = new URLSearchParams();

  // Thêm days
  params.append("days", days.toString());

  // Thêm startDate và endDate nếu có
  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  const finalUrl = `statistics/landlord-transaction?${params.toString()}`;

  const { payload } = await http.get<RevenueDataPoint[]>(finalUrl);
  return payload;
};

export const getRoomDistribution = async () => {
  const { payload } = await http.get<RoomDistribution[]>(
    "statistics/room-distribution"
  );
  return payload;
};

export const getPostsByArea = async (limit: number = 5) => {
  const { payload } = await http.get<AreaPostCount[]>(
    `statistics/posts-by-area?limit=${limit}`
  );
  return payload;
};

export const getPopularAreas = async (limit: number = 5) => {
  const { payload } = await http.get<PopularArea[]>(
    `statistics/popular-areas?limit=${limit}`
  );
  return payload;
};
