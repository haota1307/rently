"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

interface MapWithDirectionsProps {
  // Tọa độ của bài viết cho thuê trọ: [kinh độ, vĩ độ]
  rentalLocation?: [number, number];
}

// Lấy Access Token từ biến môi trường
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

console.log(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

const MapWithDirections: React.FC<MapWithDirectionsProps> = ({
  rentalLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Khởi tạo bản đồ
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: rentalLocation
        ? rentalLocation
        : [105.72283696441788, 10.007994045116583],
      zoom: 15,
    });

    // Khởi tạo Directions Control
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

    map.addControl(directions, "top-right");

    // Nếu có tọa độ của bài viết cho thuê, đặt làm điểm đến và thêm marker
    if (rentalLocation) {
      setTimeout(() => {
        directions.setDestination(rentalLocation);
      }, 300);
      new mapboxgl.Marker({ color: "black" })
        .setLngLat(rentalLocation)
        .addTo(map);
    }

    // Lấy vị trí hiện tại của người dùng và đặt làm điểm xuất phát
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

    return () => {
      map.remove();
    };
  }, [rentalLocation]);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />
  );
};

export default MapWithDirections;
