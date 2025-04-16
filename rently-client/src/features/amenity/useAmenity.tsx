import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import amenityApiRequest from "@/features/amenity/amenity.api";
import {
  GetAmenitiesQueryType,
  AmenityType,
  CreateAmenityBodyType,
  UpdateAmenityBodyType,
} from "@/schemas/amenity.schema";

export const useGetAmenities = (
  queryParams?: Partial<GetAmenitiesQueryType & { sort?: string }>
) => {
  return useQuery({
    queryKey: ["amenities", queryParams],
    queryFn: async () => {
      const res = await amenityApiRequest.list({
        page: queryParams?.page,
        limit: queryParams?.limit,
        name: queryParams?.name,
        sort: queryParams?.sort,
      });
      return res.payload;
    },
  });
};

export const useGetAmenityDetail = (
  amenityId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["amenity", amenityId],
    queryFn: async () => {
      const res = await amenityApiRequest.detail(amenityId);
      return res.payload as AmenityType;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!amenityId,
  });
};

export const useCreateAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateAmenityBodyType) => {
      const res = await amenityApiRequest.create(body);
      return res.payload as AmenityType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
    },
  });
};

export const useUpdateAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amenityId,
      body,
    }: {
      amenityId: number;
      body: UpdateAmenityBodyType;
    }) => {
      const res = await amenityApiRequest.update(amenityId, body);
      return res.payload as AmenityType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["amenity", variables.amenityId],
      });
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
    },
  });
};

export const useDeleteAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amenityId: number) => {
      const res = await amenityApiRequest.delete(amenityId);
      return res.payload;
    },
    onSuccess: (_, amenityId) => {
      queryClient.invalidateQueries({ queryKey: ["amenity", amenityId] });
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
    },
  });
};
