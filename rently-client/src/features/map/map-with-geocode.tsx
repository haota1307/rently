"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useEffect, useState, memo } from "react";
import mapboxgl from "mapbox-gl";

interface MapWithGeocodeProps {
  address: string;
  onCoordinateChange?: (coordinate: [number, number]) => void;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const MapWithGeocode: React.FC<MapWithGeocodeProps> = memo(
  ({ address, onCoordinateChange }) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map>();
    const markerRef = useRef<mapboxgl.Marker>();
    const [coordinate, setCoordinate] = useState<[number, number] | null>(null);

    // Hàm geocode: lấy tọa độ từ địa chỉ
    const geocodeAddress = async (addr: string) => {
      const encodedAddr = encodeURIComponent(addr);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddr}.json?access_token=${mapboxgl.accessToken}&limit=1`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const coords = data.features[0].center as [number, number];
          return coords;
        }
        return null;
      } catch (error) {
        console.error("Lỗi geocode:", error);
        return null;
      }
    };

    // Khởi tạo map khi component mount
    useEffect(() => {
      if (!mapContainerRef.current) return;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [105.7228, 10.008], // Tọa độ mặc định (Cần Thơ)
        zoom: 12,
      });
      mapRef.current = map;

      return () => {
        map.remove();
      };
    }, []);

    // Khi coordinate thay đổi, cập nhật marker và flyTo, sau đó gọi callback cập nhật form
    useEffect(() => {
      if (!mapRef.current || !coordinate) return;

      if (markerRef.current) {
        markerRef.current.setLngLat(coordinate);
      } else {
        markerRef.current = new mapboxgl.Marker({
          color: "red",
          draggable: true,
        })
          .setLngLat(coordinate)
          .addTo(mapRef.current);

        // Khi kéo marker kết thúc, cập nhật coordinate
        markerRef.current.on("dragend", () => {
          const lngLat = markerRef.current!.getLngLat();
          const newCoord: [number, number] = [lngLat.lng, lngLat.lat];

          setCoordinate(newCoord);
        });
      }
      mapRef.current.flyTo({ center: coordinate, zoom: 15 });

      if (onCoordinateChange) {
        onCoordinateChange(coordinate);
      }
    }, [coordinate, onCoordinateChange]);

    // Hàm xử lý tìm kiếm địa chỉ và cập nhật tọa độ
    const handleSearch = async () => {
      if (!address) return;
      const coords = await geocodeAddress(address);
      if (coords) {
        // Cập nhật coordinate chỉ khi có sự thay đổi
        if (
          !coordinate ||
          coordinate[0] !== coords[0] ||
          coordinate[1] !== coords[1]
        ) {
          setCoordinate(coords);
        }
      }
    };

    // Tự động tìm kiếm khi address thay đổi
    useEffect(() => {
      if (address) {
        handleSearch();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    return (
      <div>
        <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />
        {/* Nút tìm mới vẫn giữ để người dùng có thể update thủ công */}
        <button onClick={handleSearch} style={{ marginTop: "1rem" }}>
          Tìm mới
        </button>
      </div>
    );
  }
);

export default MapWithGeocode;
