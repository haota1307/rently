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

export const getRevenueData = async (
  days: number = 7,
  transaction_content?: string
) => {
  let url = `statistics/revenue?days=${days}`;

  if (transaction_content) {
    url += `&transaction_content=${transaction_content}`;
  }

  const { payload } = await http.get<RevenueDataPoint[]>(url);
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
