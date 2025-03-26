import addressApiRequest from "@/features/address/address.api";
import { useQuery } from "@tanstack/react-query";

export const useDistricts = () => {
  return useQuery({
    queryKey: ["districts"],
    queryFn: addressApiRequest.getDistricts,
  });
};
export const useWards = () => {
  return useQuery({
    queryKey: ["wards"],
    queryFn: addressApiRequest.getWards,
  });
};
export const useStreets = () => {
  return useQuery({
    queryKey: ["streets"],
    queryFn: addressApiRequest.getStreets,
  });
};
