import roomApiRequest from "@/features/rooms/room.api";
import {
  CreateRoomBodyType,
  GetRoomDetailResType,
  GetRoomsQueryType,
  UpdateRoomBodyType,
} from "@/schemas/room.schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetRooms = (queryParams: GetRoomsQueryType) => {
  return useQuery({
    queryKey: ["rooms", queryParams],
    queryFn: async () => {
      const res = await roomApiRequest.list(queryParams);
      return res.payload;
    },
  });
};

export const useGetMyRooms = (queryParams: GetRoomsQueryType) => {
  return useQuery({
    queryKey: ["rooms", queryParams],
    queryFn: async () => {
      const res = await roomApiRequest.listMyRooms(queryParams);
      return res.payload;
    },
  });
};
export const useGetRoomDetail = (roomId: number) => {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await roomApiRequest.detail(roomId);
      return res.payload as GetRoomDetailResType;
    },
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRoomBodyType) => {
      const res = await roomApiRequest.create(body);
      return res.payload as GetRoomDetailResType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      body,
    }: {
      roomId: number;
      body: UpdateRoomBodyType;
    }) => {
      const res = await roomApiRequest.update(roomId, body);
      return res.payload as GetRoomDetailResType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: number) => {
      const res = await roomApiRequest.delete(roomId);
      return res.payload;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

// Hook để admin tạo phòng trọ cho người cho thuê
export const useCreateRoomForLandlord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateRoomBodyType & { landlordId: number }) => {
      const res = await roomApiRequest.createForLandlord(body);
      return res.payload as GetRoomDetailResType;
    },
    onSuccess: () => {
      // Invalidate các query liên quan
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });
};
