import http from "@/lib/http";
import {
  DistrictsResponse,
  StreetsResponse,
  WardsResponse,
} from "@/schemas/address.schema";

const prefix = "/addresses";

const addressApiRequest = {
  getStreets: () => http.get<StreetsResponse>(`${prefix}/streets`),
  getWards: () => http.get<WardsResponse>(`${prefix}/wards`),
  getDistricts: () => http.get<DistrictsResponse>(`${prefix}/districts`),
};

export default addressApiRequest;
