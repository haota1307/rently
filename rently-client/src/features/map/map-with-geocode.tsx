"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useEffect, useState, memo } from "react";
import mapboxgl from "mapbox-gl";

interface MapWithGeocodeProps {
  address: string;
  onCoordinateChange?: (coordinate: [number, number]) => void;
  onAddressChange?: (address: string) => void;
  defaultCoordinate?: [number, number];
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const MapWithGeocode: React.FC<MapWithGeocodeProps> = memo(
  ({ address, onCoordinateChange, onAddressChange, defaultCoordinate }) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map>();
    const markerRef = useRef<mapboxgl.Marker>();
    const [coordinate, setCoordinate] = useState<[number, number] | null>(
      defaultCoordinate ?? null
    );
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
      if (defaultCoordinate) setCoordinate(defaultCoordinate);
    }, [defaultCoordinate]);

    useEffect(() => {
      if (!mapContainerRef.current) return;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: defaultCoordinate || [105.7228, 10.008],
        zoom: 12,
      });
      mapRef.current = map;

      map.on("load", () => {
        setMapLoaded(true);
      });

      return () => map.remove();
    }, []);

    useEffect(() => {
      if (!mapLoaded || !coordinate) return;

      if (markerRef.current) {
        markerRef.current.setLngLat(coordinate);
      } else {
        markerRef.current = new mapboxgl.Marker({
          color: "red",
          draggable: true,
        })
          .setLngLat(coordinate)
          .addTo(mapRef.current!);

        markerRef.current.on("dragend", async () => {
          const lngLat = markerRef.current!.getLngLat();
          const newCoord: [number, number] = [lngLat.lng, lngLat.lat];
          setCoordinate(newCoord);

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${newCoord[1]}&lon=${newCoord[0]}&format=json`
            );
            const data = await response.json();

            console.log({ data });

            const newAddress = data.display_name;

            if (onAddressChange && newAddress) {
              onAddressChange(newAddress);
            }
          } catch (error) {
            console.error("Lỗi reverse geocode:", error);
          }
        });
      }

      mapRef.current!.flyTo({ center: coordinate, zoom: 15 });

      if (onCoordinateChange) {
        onCoordinateChange(coordinate);
      }
    }, [coordinate, mapLoaded, onCoordinateChange, onAddressChange]);

    console.log({ address });

    return (
      <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />
    );
  }
);

export default MapWithGeocode;
