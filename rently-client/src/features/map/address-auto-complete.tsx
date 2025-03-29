import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  onCoordinateChange: (coordinate: [number, number]) => void;
  onAddressChange?: (address: string) => void;
  value?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onCoordinateChange,
  onAddressChange,
  value = "",
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    setQuery(value); // Cập nhật state khi prop value thay đổi
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      )
        .then((res) => res.json())
        .then(setSuggestions)
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (sug: Suggestion) => {
    setQuery(sug.display_name);
    setSuggestions([]);

    const coords: [number, number] = [parseFloat(sug.lon), parseFloat(sug.lat)];
    onCoordinateChange(coords);
    onAddressChange?.(sug.display_name);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Nhập địa chỉ</label>
        <Input
          placeholder="Nhập địa chỉ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="border rounded-md shadow divide-y">
          {suggestions.map((sug) => (
            <li
              key={sug.place_id}
              onClick={() => handleSelect(sug)}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
            >
              {sug.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
