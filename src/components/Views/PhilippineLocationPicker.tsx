import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { getRegionNames, getProvincesByRegion, getCitiesByProvince } from '../../utils/philippineLocations';

interface PhilippineLocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
}

export function PhilippineLocationPicker({ value, onChange, placeholder = "Enter tournament location" }: PhilippineLocationPickerProps) {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');

  // Parse existing value when component mounts or value changes
  useEffect(() => {
    if (value && !selectedRegion) {
      // Try to parse the existing location
      const parts = value.split(', ');
      if (parts.length >= 2) {
        setSpecificLocation(parts[0]);
        // Try to find matching region/province/city
        const locationPart = parts[parts.length - 1];
        const regions = getRegionNames();
        
        for (const regionName of regions) {
          const provinces = getProvincesByRegion(regionName);
          for (const province of provinces) {
            if (province.cities.some(city => locationPart.includes(city))) {
              setSelectedRegion(regionName);
              setSelectedProvince(province.name);
              const foundCity = province.cities.find(city => locationPart.includes(city));
              if (foundCity) {
                setSelectedCity(foundCity);
              }
              return;
            }
          }
        }
      } else {
        setSpecificLocation(value);
      }
    }
  }, [value]);

  // Update the full location when any part changes
  useEffect(() => {
    if (selectedRegion && selectedProvince && selectedCity) {
      const fullLocation = specificLocation 
        ? `${specificLocation}, ${selectedCity}, ${selectedProvince}, ${selectedRegion}`
        : `${selectedCity}, ${selectedProvince}, ${selectedRegion}`;
      onChange(fullLocation);
    } else if (specificLocation && !selectedRegion) {
      onChange(specificLocation);
    }
  }, [selectedRegion, selectedProvince, selectedCity, specificLocation, onChange]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedProvince('');
    setSelectedCity('');
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity('');
  };

  const provinces = selectedRegion ? getProvincesByRegion(selectedRegion) : [];
  const cities = selectedRegion && selectedProvince ? getCitiesByProvince(selectedRegion, selectedProvince) : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Region Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Region</option>
            {getRegionNames().map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Province Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            disabled={!selectedRegion}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select Province</option>
            {provinces.map(province => (
              <option key={province.name} value={province.name}>{province.name}</option>
            ))}
          </select>
        </div>

        {/* City Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedProvince}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Specific Location Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Specific Location <span className="text-gray-500">(e.g., venue name, address)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={specificLocation}
            onChange={(e) => setSpecificLocation(e.target.value)}
            className="input-field w-full pr-10"
            placeholder="Enter specific venue or address"
          />
          <MapPin size={20} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)', right: '12px' }} />
        </div>
      </div>

      {/* Preview */}
      {(selectedCity || specificLocation) && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-sm text-gray-600 mb-1">Full Location:</div>
          <div className="font-medium text-gray-900">
            {selectedRegion && selectedProvince && selectedCity
              ? (specificLocation 
                  ? `${specificLocation}, ${selectedCity}, ${selectedProvince}, ${selectedRegion}`
                  : `${selectedCity}, ${selectedProvince}, ${selectedRegion}`)
              : specificLocation || 'Please select location'
            }
          </div>
        </div>
      )}
    </div>
  );
}