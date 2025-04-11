import { NextResponse } from 'next/server';

// Define the structure for a parsed TLE
export interface TleData {
  name: string;
  line1: string;
  line2: string;
}

// Define supported satellite groups
const SUPPORTED_GROUPS = {
  starlink: 'starlink',
  stations: 'stations', // ISS and other space stations
  iridium: 'iridium',
  noaa: 'noaa',     // Weather satellites
  gps: 'gps-ops',   // GPS satellites
  galileo: 'galileo' // European GNSS
};

// Default group if none is specified
const DEFAULT_GROUP = 'starlink';

export async function GET(request: Request) {
  // Get the URL from the request
  const { searchParams } = new URL(request.url);
  
  // Extract the group parameter
  const requestedGroup = searchParams.get('group')?.toLowerCase();
  
  // Validate the group parameter
  const group = requestedGroup && SUPPORTED_GROUPS[requestedGroup as keyof typeof SUPPORTED_GROUPS]
    ? SUPPORTED_GROUPS[requestedGroup as keyof typeof SUPPORTED_GROUPS]
    : DEFAULT_GROUP;

  console.log(`API route /api/tle GET handler invoked for group: ${group}`);
  
  // Construct the CelesTrak URL with the selected group
  const CELESTRAK_URL = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;

  try {
    // Added user-agent header as CelesTrak might require it
    const response = await fetch(CELESTRAK_URL, {
        headers: {
            'User-Agent': 'Open-Source-Satellite-Tracker/1.0' 
        }
    });

    if (!response.ok) {
      console.error(`Failed to fetch TLE data for group ${group}: ${response.status} ${response.statusText}`);
      // Optionally log response body if available
      try {
          const errorBody = await response.text();
          console.error('Error response body:', errorBody);
      } catch {}
      
      return NextResponse.json(
        { error: `Failed to fetch TLE data from CelesTrak: ${response.statusText}` },
        { status: response.status }
      );
    }

    const tleText = await response.text();
    const lines = tleText.trim().split(/\r?\n/); // Handle different line endings
    const tleData: TleData[] = [];

    if (lines.length < 3) {
        console.warn(`Received TLE data for group ${group} has less than 3 lines. Raw data:`, tleText);
        return NextResponse.json({ tleData: [] });
    }

    for (let i = 0; i <= lines.length - 3; i += 3) {
      const name = lines[i].trim();
      const line1 = lines[i + 1].trim();
      const line2 = lines[i + 2].trim();

      // Basic validation
      if (name && line1.startsWith('1 ') && line2.startsWith('2 ') && line1.length >= 69 && line2.length >= 69) {
        tleData.push({ name, line1, line2 });
      } else {
        // Avoid logging potentially very long strings if format is weird
        console.warn(`Skipping potentially malformed TLE entry near line index ${i}: Name: '${name.substring(0,50)}' Line1 starts with: '${line1.substring(0,10)}' Line2 starts with: '${line2.substring(0,10)}'`);
      }
    }

    // Check if any TLEs were actually parsed
    if (tleData.length === 0 && lines.length >= 3) {
        console.warn(`TLE parsing for group ${group} resulted in an empty array, check input data format and parsing logic. Raw line count:`, lines.length);
    }
    
    console.log(`Successfully parsed ${tleData.length} TLE entries for group ${group}.`);
    return NextResponse.json({ tleData, group });

  } catch (error) {
    // Improved error logging
    if (error instanceof Error) {
        console.error(`Error in /api/tle GET handler for group ${group}:`, error.message, error.stack);
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` }, 
            { status: 500 }
        );
    } else {
        console.error(`Unknown error in /api/tle GET handler for group ${group}:`, error);
        return NextResponse.json(
            { error: 'An unknown internal server error occurred' }, 
            { status: 500 }
        );
    }
  }
} 