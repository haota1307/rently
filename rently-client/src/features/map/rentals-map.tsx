"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import rentalApiRequest from "@/features/rental/rental.api";
import { RentalType } from "@/schemas/rental.schema";
import { useRouter } from "next/navigation";
import { createPostSlug } from "@/lib/utils";

const RentalsMap: React.FC = () => {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map>();
  const [rentals, setRentals] = useState<RentalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dữ liệu nhà trọ
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await rentalApiRequest.list({
          limit: 100,
          page: 1,
        });

        // Xử lý dữ liệu response
        if (response.payload?.data) {
          setRentals(response.payload.data);
        } else {
          console.error("Cấu trúc dữ liệu không đúng:", response);
          setError("Không thể xác định cấu trúc dữ liệu");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà trọ:", error);
        setError("Không thể tải dữ liệu nhà trọ");
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  // Khởi tạo bản đồ
  useEffect(() => {
    if (!mapContainerRef.current || loading || rentals.length === 0) return;

    const initMap = async () => {
      try {
        // Lấy token
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!token) {
          console.error("Thiếu Mapbox access token");
          setError("Thiếu cấu hình bản đồ");
          return;
        }

        // Thiết lập token
        mapboxgl.accessToken = token;

        // Tạo bản đồ
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v11",
          center: [105.7228, 10.008], // Tọa độ mặc định (Cần Thơ)
          zoom: 12,
        });

        mapRef.current = map;

        // Xử lý sự kiện khi bản đồ đã load
        map.on("load", () => {
          // Tạo bounds để fit tất cả markers
          const bounds = new mapboxgl.LngLatBounds();

          // Thêm marker cho mỗi nhà trọ
          rentals.forEach((rental) => {
            // Kiểm tra tọa độ hợp lệ
            if (!rental.lat || !rental.lng) return;

            // Tạo phần tử HTML cho marker
            const el = document.createElement("div");
            el.className = "rental-marker";
            el.style.width = "30px";
            el.style.height = "30px";
            el.style.backgroundColor = "#FF385C";
            el.style.borderRadius = "50%";
            el.style.display = "flex";
            el.style.justifyContent = "center";
            el.style.alignItems = "center";
            el.style.cursor = "pointer";
            el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
            el.innerHTML =
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';

            // Tạo popup khi hover lên marker
            const popup = new mapboxgl.Popup({
              offset: 25,
              closeButton: false,
            }).setHTML(
              `<div style="max-width:200px;">
                <h3 style="font-weight:600;margin-bottom:4px;font-size:14px;">${
                  rental.title
                }</h3>
                <p style="font-size:12px;color:#666;margin-bottom:4px;">${
                  rental.address
                }</p>
                ${
                  rental.rooms && rental.rooms.length > 0
                    ? `<p style="font-size:12px;color:#FF385C;font-weight:500;">${
                        rental.rooms.length
                      } phòng từ ${Math.min(
                        ...rental.rooms.map((r) => r.price)
                      ).toLocaleString("vi-VN")} VNĐ</p>`
                    : '<p style="font-size:12px;color:#777;">Chưa có thông tin phòng</p>'
                }
              </div>`
            );

            // Thêm marker vào bản đồ
            const marker = new mapboxgl.Marker(el)
              .setLngLat([rental.lng, rental.lat])
              .setPopup(popup)
              .addTo(map);

            // Thêm sự kiện click vào marker
            el.addEventListener("click", () => {
              router.push(
                `/nha-tro/${createPostSlug(rental.title, rental.id)}`
              );
            });

            // Thêm tọa độ vào bounds
            bounds.extend([rental.lng, rental.lat]);
          });

          // Điều chỉnh bản đồ để hiển thị tất cả markers
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 15,
            });
          }
        });

        // Bắt lỗi bản đồ
        map.on("error", (e) => {
          console.error("Lỗi bản đồ:", e);
          setError("Lỗi khi tải bản đồ");
        });

        // Cleanup function
        return () => map.remove();
      } catch (error) {
        console.error("Lỗi khởi tạo bản đồ:", error);
        setError("Không thể khởi tạo bản đồ");
      }
    };

    initMap();
  }, [rentals, loading, router]);

  return (
    <div className="w-full h-full">
      {loading ? (
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        </div>
      ) : error ? (
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center px-4">
            <svg
              className="w-10 h-10 text-gray-400 mx-auto mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        </div>
      ) : (
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "300px", borderRadius: "0.5rem" }}
        />
      )}
    </div>
  );
};

export default RentalsMap;
