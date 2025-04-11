'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useTleData } from '@/hooks/useTleData';

// Supported satellite groups with display names
const SATELLITE_GROUPS = [
  { id: 'starlink', name: 'Starlink' },
  { id: 'stations', name: 'ISS & Space Stations' },
  { id: 'iridium', name: 'Iridium' },
  { id: 'noaa', name: 'NOAA Weather' },
  { id: 'gps', name: 'GPS' },
  { id: 'galileo', name: 'Galileo' }
];

// Dynamically import the CesiumViewer component with SSR disabled
const CesiumViewer = dynamic(() => import('@/components/cesium/CesiumViewer'), {
  ssr: false,
  loading: () => <div className="h-screen w-screen flex justify-center items-center"><p>Loading Cesium Viewer...</p></div>
});

export default function Home() {
  // State for the selected satellite group
  const [selectedGroup, setSelectedGroup] = useState<string>('starlink');
  
  // Use the hook to fetch TLE data for the selected group
  const { tleData, isLoading, error } = useTleData(selectedGroup);

  // Log the data when it arrives
  useEffect(() => {
    if (tleData) {
      console.log(`Fetched ${tleData.length} TLE entries for ${selectedGroup}`);
    } else if (error) {
      console.error(`Error fetching TLE data for ${selectedGroup}:`, error);
    }
  }, [tleData, error, selectedGroup]);

  // Handle group selection
  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
  };

  return (
    <main className="h-screen w-screen overflow-hidden relative">
      {/* Satellite Group Filter Bar */}
      <div className="absolute top-0 left-0 z-20 w-full p-2 bg-gray-800 bg-opacity-70 flex flex-wrap justify-center gap-2">
        {SATELLITE_GROUPS.map(group => (
          <button
            key={group.id}
            onClick={() => handleGroupChange(group.id)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedGroup === group.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* Display loading overlay */}
      {isLoading && (
        <div className="absolute top-16 left-0 z-10 w-full p-4 text-center bg-blue-100 bg-opacity-80">
          Loading {selectedGroup} data...
        </div>
      )}
      
      {/* Display error overlay */}
      {error && (
        <div className="absolute top-16 left-0 z-10 w-full p-4 text-center bg-red-100 bg-opacity-80 text-red-700">
          Error: {error}
        </div>
      )}
      
      {/* Display statistics */}
      {tleData && !isLoading && (
        <div className="absolute top-16 right-4 z-10 p-2 bg-gray-800 bg-opacity-70 text-white rounded text-sm">
          {tleData.length} satellites
        </div>
      )}
      
      {/* Render Cesium Viewer, passing TLE data as a prop */}
      <CesiumViewer tleData={tleData} />
    </main>
  );
}
