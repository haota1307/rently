import ListingItem from "@/components/listings/listing-items";
import PaginationComponent from "@/components/pagination-component";

const Listings = () => {
  const listings = [
    {
      id: 1,
      image: "/house.jpg",
      title: "Phòng trọ gần Đại học Nam Cần Thơ",
      address: "Khu vực Hưng Lợi, Ninh Kiều, Cần Thơ",
      price: "2.5 triệu/tháng",
      area: "30 m²",
      amenities: ["Máy lạnh", "WiFi miễn phí", "Chỗ để xe"],
      landlord: {
        name: "Nguyễn Văn A",
        phone: "0901234567",
        avatar:
          "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/175607/Originals/avt-cho-cute%20(9).jpg",
      },
    },
    {
      id: 1,
      image: "/house.jpg",
      title: "Phòng trọ gần Đại học Nam Cần Thơ",
      address: "Khu vực Hưng Lợi, Ninh Kiều, Cần Thơ",
      price: "2.5 triệu/tháng",
      area: "30 m²",
      amenities: ["Máy lạnh", "Bảo vệ 24/24", "Chỗ để xe"],
      landlord: {
        name: "Nguyễn Văn A",
        phone: "0901234567",
        avatar:
          "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/175607/Originals/avt-cho-cute%20(9).jpg",
      },
    },
    {
      id: 1,
      image: "/house.jpg",
      title: "Phòng trọ gần Đại học Nam Cần Thơ",
      address: "Khu vực Hưng Lợi, Ninh Kiều, Cần Thơ",
      price: "2.5 triệu/tháng",
      area: "30 m²",
      amenities: ["Máy lạnh", "WiFi miễn phí", "Chỗ để xe"],
      landlord: {
        name: "Nguyễn Văn A",
        phone: "0901234567",
        avatar:
          "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/175607/Originals/avt-cho-cute%20(9).jpg",
      },
    },
  ];

  return (
    <div className="w-full mx-auto px-4 space-y-6">
      {listings.map((listing, index) => (
        <ListingItem key={index} {...listing} />
      ))}
      <div className="pt-16 w-full">
        <PaginationComponent />
      </div>
    </div>
  );
};

export default Listings;
