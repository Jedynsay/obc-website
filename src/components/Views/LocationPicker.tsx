import React from 'react';
import { PhilippineLocationPicker } from './PhilippineLocationPicker';

interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

export function LocationPicker({ value, onChange, placeholder = "Enter tournament location" }: LocationPickerProps) {
  const handleLocationChange = (location: string) => {
    // Call onChange without coordinates since we're not using maps anymore
    onChange(location);
  };

  return (
    <PhilippineLocationPicker
      value={value}
      onChange={handleLocationChange}
      placeholder={placeholder}
    />
  );
}