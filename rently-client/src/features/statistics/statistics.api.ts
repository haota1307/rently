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
  nạp: number;
  rút: number;
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
    console.log("Adding startDate to URL:", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
    console.log("Adding endDate to URL:", endDate);
  }

  if (transaction_content) {
    params.append("transaction_content", transaction_content);
  }

  // Log URL cuối cùng để debug
  const finalUrl = `statistics/revenue?${params.toString()}`;
  console.log("Fetching revenue data from URL:", finalUrl);

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
