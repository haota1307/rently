import { z } from "zod";

const WardSchema = z.object({
  id: z.number(),
  name: z.string(),
  district_id: z.number(),
});

const WardsResponseSchema = z.object({
  wards: z.array(WardSchema),
});

const StreetSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const StreetsResponseSchema = z.object({
  streets: z.array(StreetSchema),
});

const DistrictSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const DistrictsResponseSchema = z.object({
  districts: z.array(DistrictSchema),
});

export type Street = z.infer<typeof StreetSchema>;
export type StreetsResponse = z.infer<typeof StreetsResponseSchema>;
export type Ward = z.infer<typeof WardSchema>;
export type WardsResponse = z.infer<typeof WardsResponseSchema>;
export type District = z.infer<typeof DistrictSchema>;
export type DistrictsResponse = z.infer<typeof DistrictsResponseSchema>;
