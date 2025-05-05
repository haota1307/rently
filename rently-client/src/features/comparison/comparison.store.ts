import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PostType, RentalPostStatus } from "@/schemas/post.schema";
import { RentalType } from "@/schemas/rental.schema";

// Tối đa 4 phòng để so sánh
const MAX_ITEMS = 4;

interface ComparisonStore {
  // Danh sách các phòng trọ đang so sánh
  items: PostType[];

  // Thêm phòng vào danh sách so sánh
  addItem: (post: PostType) => boolean;

  // Thêm rental vào danh sách so sánh (sẽ chuyển đổi sang PostType)
  addRental: (rental: RentalType) => boolean;

  // Xóa phòng khỏi danh sách so sánh
  removeItem: (postId: number) => void;

  // Kiểm tra xem phòng đã được thêm vào so sánh chưa
  isAdded: (postId: number) => boolean;

  // Xóa tất cả phòng khỏi danh sách so sánh
  clearAll: () => void;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (post: PostType) => {
        const items = get().items;

        // Nếu đã tồn tại phòng này thì không thêm nữa
        if (items.some((item) => item.id === post.id)) {
          return false;
        }

        // Nếu đã đạt tối đa số lượng so sánh
        if (items.length >= MAX_ITEMS) {
          return false;
        }

        // Thêm phòng vào danh sách
        set({ items: [...items, post] });
        return true;
      },

      addRental: (rental: RentalType) => {
        const items = get().items;

        // Nếu đã tồn tại phòng này thì không thêm nữa
        if (items.some((item) => item.id === rental.id)) {
          return false;
        }

        // Nếu đã đạt tối đa số lượng so sánh
        if (items.length >= MAX_ITEMS) {
          return false;
        }

        // Tạo object date không null
        const createdAt = rental.createdAt || new Date();
        const roomCreatedAt = rental.rooms?.[0]?.createdAt || new Date();
        const updatedAt = rental.updatedAt || new Date();
        const roomUpdatedAt = rental.rooms?.[0]?.updatedAt || null;

        // Chuyển đổi RentalType sang PostType
        try {
          const post: PostType = {
            id: rental.id,
            title: rental.title,
            description: rental.description,
            status: RentalPostStatus.ACTIVE,
            createdAt: createdAt,
            rentalId: rental.id,
            rental: {
              id: rental.id,
              title: rental.title,
              description: rental.description,
              address: rental.address,
              lat: rental.lat,
              lng: rental.lng,
              distance: rental.distance,
              createdAt: createdAt,
              rentalImages: rental.rentalImages,
            },
            landlordId: rental.landlordId,
            landlord: rental.landlord || {
              id: rental.landlordId,
              email: "",
              name: "",
              phoneNumber: null,
              avatar: null,
            },
            startDate: new Date(),
            endDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ),
            pricePaid: 0,
            deposit: rental.rooms?.[0]?.price || 0,
            room: {
              id: rental.rooms?.[0]?.id || 0,
              title: rental.rooms?.[0]?.title || "",
              price: rental.rooms?.[0]?.price || 0,
              area: rental.rooms?.[0]?.area || 0,
              isAvailable: true,
              rentalId: rental.id,
              createdAt: roomCreatedAt,
              updatedAt: roomUpdatedAt,
              amenities: rental.rooms?.[0]?.amenities || [],
              roomAmenities: rental.rooms?.[0]?.roomAmenities || [],
              roomImages: rental.rooms?.[0]?.roomImages || [],
            },
          };

          // Thêm phòng vào danh sách
          set({ items: [...items, post] });
          return true;
        } catch (error) {
          console.error("Error adding rental to comparison:", error);
          return false;
        }
      },

      removeItem: (postId: number) => {
        set({
          items: get().items.filter((item) => item.id !== postId),
        });
      },

      isAdded: (postId: number) => {
        return get().items.some((item) => item.id === postId);
      },

      clearAll: () => {
        set({ items: [] });
      },
    }),
    {
      name: "room-comparison", // Tên của key trong localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const getComparisonCount = () => {
  const state = useComparisonStore.getState();
  return state.items.length;
};

export const MAX_COMPARISON_ITEMS = MAX_ITEMS;
