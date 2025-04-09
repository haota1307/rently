import { useQuery } from "@tanstack/react-query";
import { getStatisticsOverview } from "./statistics.api";

export const useGetStatisticsOverview = () => {
  return useQuery({
    queryKey: ["statistics", "overview"],
    queryFn: getStatisticsOverview,
  });
};
