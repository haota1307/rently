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

export const getStatisticsOverview = async () => {
  const { payload } = await http.get<StatisticsOverview>("statistics/overview");
  return payload;
};
