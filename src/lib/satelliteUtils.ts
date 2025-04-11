// Utility functions for satellite TLE processing and coordinate conversion
import * as satellite from 'satellite.js';
import { Cartesian3, Color, JulianDate } from 'cesium';
import type { TleData } from '@/app/api/tle/route';

// Interface for satellite position data
export interface SatellitePosition {
  id: string;
  name: string;
  position: Cartesian3;
  isValid: boolean;
}

// Parse a TLE entry and return a satellite record
export function parseTle(tleData: TleData): satellite.SatRec {
  const { name, line1, line2 } = tleData;
  try {
    // Parse TLE data into a satellite record
    const satrec = satellite.twoline2satrec(line1, line2);
    return satrec;
  } catch (error) {
    console.error(`Error parsing TLE for ${name}:`, error);
    throw new Error(`Invalid TLE data for ${name}`);
  }
}

// Calculate satellite position at a given time
export function calculateSatellitePosition(
  satrec: satellite.SatRec,
  time: JulianDate,
  name: string
): SatellitePosition {
  try {
    // Get the time in JavaScript Date
    const jsDate = JulianDate.toDate(time);
    
    // Calculate minutes since epoch
    const minutesSinceEpoch = (jsDate.getTime() - satrec.epochJd * 86400000) / 60000;

    // Check if the satellite has decayed
    if (minutesSinceEpoch > satrec.decayRate) {
      console.warn(`Satellite ${name} appears to have decayed.`);
      return {
        id: name,
        name: name,
        position: Cartesian3.ZERO,
        isValid: false,
      };
    }

    // Propagate the satellite to current time
    // Returns position and velocity in km in True Equator Mean Equinox (TEME) reference frame
    const positionAndVelocity = satellite.propagate(satrec, jsDate);
    
    // Check if propagation succeeded
    if (!positionAndVelocity.position || !positionAndVelocity.velocity) {
      console.warn(`Failed to calculate position for ${name}.`);
      return {
        id: name,
        name: name,
        position: Cartesian3.ZERO,
        isValid: false,
      };
    }

    // Get position in TEME coordinates (kilometers)
    const positionTeme = positionAndVelocity.position;

    // Get current GMST (Greenwich Mean Sidereal Time) for conversion from TEME to ECEF
    const gmst = satellite.gstime(jsDate);

    // Convert from TEME to ECEF (Earth-centered, Earth-fixed)
    const positionEcf = satellite.eciToEcf(positionTeme, gmst);

    // Convert from kilometers to meters (Cesium uses meters)
    const positionCesium = Cartesian3.fromElements(
      positionEcf.x * 1000,
      positionEcf.y * 1000,
      positionEcf.z * 1000
    );

    return {
      id: name,
      name: name,
      position: positionCesium,
      isValid: true,
    };
  } catch (error) {
    console.error(`Error calculating position for ${name}:`, error);
    return {
      id: name,
      name: name,
      position: Cartesian3.ZERO,
      isValid: false,
    };
  }
}

// Calculate positions for an array of TLE data
export function calculateSatellitePositions(
  tleDataArray: TleData[],
  time: JulianDate
): SatellitePosition[] {
  const positions: SatellitePosition[] = [];

  for (const tleData of tleDataArray) {
    try {
      const satrec = parseTle(tleData);
      const position = calculateSatellitePosition(satrec, time, tleData.name);
      positions.push(position);
    } catch (error) {
      console.error(`Error processing TLE entry ${tleData.name}:`, error);
      // Add an invalid position entry
      positions.push({
        id: tleData.name,
        name: tleData.name,
        position: Cartesian3.ZERO,
        isValid: false,
      });
    }
  }

  return positions;
}

// Generate a simple color based on satellite name (for visualization variety)
export function getSatelliteColor(name: string): Color {
  // Simple hash function for the name to generate a consistent color
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Generate hue from 0-360 degrees
  const hue = Math.abs(hash % 360);
  
  // Use HSL with consistent saturation and lightness
  return Color.fromHsl(hue / 360, 1.0, 0.6, 1.0);
} 