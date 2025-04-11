'use client'; // Hooks used in client components must be client components themselves

import { useState, useEffect } from 'react';
import type { TleData } from '@/app/api/tle/route'; // Import the interface

interface UseTleDataState {
  tleData: TleData[] | null;
  isLoading: boolean;
  error: string | null;
  group: string;
}

export function useTleData(group: string = 'starlink'): UseTleDataState {
  const [state, setState] = useState<UseTleDataState>({
    tleData: null,
    isLoading: true,
    error: null,
    group
  });

  useEffect(() => {
    const fetchData = async () => {
      // Reset state for new group
      setState((prevState: UseTleDataState) => ({ 
        ...prevState, 
        isLoading: true, 
        error: null,
        group
      }));

      try {
        console.log(`Fetching TLE data for group: ${group}`);
        const response = await fetch(`/api/tle?group=${encodeURIComponent(group)}`);
        
        if (!response.ok) {
          // Attempt to read error message from response body
          let errorMsg = `Failed to fetch TLE data for ${group}: ${response.status} ${response.statusText}`;
          try {
              const errorData = await response.json();
              if (errorData && errorData.error) {
                  errorMsg = errorData.error; // Use error message from API response if available
              }
          } catch (jsonError) {
              console.warn('Could not parse error response body as JSON', jsonError);
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.tleData)) {
            console.error(`Invalid data structure received from /api/tle for ${group}:`, data);
            throw new Error('Invalid data structure received from API.');
        }
        
        console.log(`Successfully fetched and parsed ${data.tleData.length} TLE entries for ${group}`);
        setState({
          tleData: data.tleData,
          isLoading: false,
          error: null,
          group: data.group || group
        });

      } catch (err) {
        console.error(`Error in useTleData hook for group ${group}:`, err);
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
        setState((prevState: UseTleDataState) => ({
          ...prevState,
          tleData: null,
          isLoading: false,
          error: errorMsg
        }));
      }
    };

    fetchData();

    // No cleanup needed for this fetch
  }, [group]); // Re-run effect when group changes

  return state;
} 