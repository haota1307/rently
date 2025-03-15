"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

// Lấy Access Token từ biến môi trường
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const MapWithGeocoding: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<[number, number] | null>(null);
  // Lưu tham chiếu bản đồ để update khi cần (không khởi tạo lại toàn bộ bản đồ)
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // Lưu tham chiếu marker điểm đến để cập nhật vị trí khi tìm kiếm
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Hàm gọi Geocoding API để lấy tọa độ từ địa chỉ
  const handleSearch = async () => {
    if (!address) return;
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${accessToken}&language=vi`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const firstFeature = data.features[0];
        // Tọa độ ở dạng [kinh độ, vĩ độ]
        const coords: [number, number] = firstFeature.center;
        setLocation(coords);
      } else {
        alert("Không tìm thấy địa chỉ.");
      }
    } catch (error) {
      console.error("Lỗi geocoding:", error);
    }
  };

  // Khởi tạo bản đồ một lần duy nhất
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Sử dụng vị trí tìm kiếm nếu có, ngược lại dùng vị trí mặc định
    const center = location
      ? location
      : [105.72283696441788, 10.007994045116583];

    // Tạo bản đồ và lưu vào ref
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      // center: ,
      zoom: 15,
    });

    // Thêm Directions control
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      profile: "mapbox/driving",
      language: "vi",
      placeholderOrigin: "Chọn điểm xuất phát",
      placeholderDestination: "Chọn điểm đến",
      controls: {
        inputs: true,
        instructions: true,
        profileSwitcher: false,
      },
    });
    mapRef.current.addControl(directions, "top-right");

    // Đặt điểm xuất phát dựa vào vị trí hiện tại của người dùng
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          directions.setOrigin(userLocation);
        },
        (error) => {
          console.error("Không lấy được vị trí hiện tại:", error);
        }
      );
    }

    // Lắng nghe sự kiện click trên bản đồ để thêm marker có khả năng kéo (tùy chọn)
    mapRef.current.on("click", (event) => {
      const { lng, lat } = event.lngLat;
      const marker = new mapboxgl.Marker({ color: "red", draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current!);
      marker.on("dragend", () => {
        const newLngLat = marker.getLngLat();
        console.log(
          "Vị trí marker mới sau khi kéo:",
          newLngLat.lng,
          newLngLat.lat
        );
      });
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []); // khởi tạo một lần khi component load

  // Khi tọa độ từ geocoding thay đổi, cập nhật bản đồ
  useEffect(() => {
    if (!mapRef.current || !location) return;

    // Cập nhật trung tâm bản đồ
    mapRef.current.flyTo({ center: location, zoom: 15 });

    // Cập nhật điểm đến cho Directions control
    // Vì Directions control được thêm vào bản đồ, ta tìm nó thông qua các control đã thêm
    const controls = mapRef.current._controls;
    const directionsControl = controls.find(
      (ctrl) => ctrl instanceof MapboxDirections
    ) as any;
    if (directionsControl) {
      setTimeout(() => {
        directionsControl.setDestination(location);
      }, 300);
    }

    // Cập nhật hoặc thêm marker điểm đến
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLngLat(location);
    } else {
      destinationMarkerRef.current = new mapboxgl.Marker({ color: "black" })
        .setLngLat(location)
        .addTo(mapRef.current);
    }
  }, [location]);

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Nhập địa chỉ..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ padding: "0.5rem", width: "300px" }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}
        >
          Tìm kiếm
        </button>
      </div>
      <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />
    </div>
  );
};

export default MapWithGeocoding;
