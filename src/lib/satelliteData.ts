// Generate more realistic sample satellite data
// In a real application, this would be fetched from a TLE API

// Function to generate random coordinates within a range
function randomCoordinate(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Function to generate random altitude within a range
function randomAltitude(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

// Satellite types and their corresponding altitude ranges
const satelliteTypes: { [key: string]: { min: number; max: number } } = {
  "Starlink": { min: 500, max: 600 },
  "Space Station": { min: 400, max: 450 },
  "Telescope": { min: 500, max: 600 },
  "Weather": { min: 700, max: 900 },
  "Communication": { min: 1000, max: 1500 },
  "Navigation": { min: 20000, max: 25000 },
  "Military": { min: 500, max: 1000 },
  "Science": { min: 600, max: 800 },
  "Debris": { min: 400, max: 1000 }
};

// Generate a list of sample satellites
export function generateSampleSatellites(count: number) {
  const satellites = [];
  const types = Object.keys(satelliteTypes);
  
  // Add real known satellites first
  satellites.push(
    { id: 1, name: "ISS", type: "Space Station", lat: 40, lng: -75, altitude: 408 },
    { id: 2, name: "Hubble", type: "Telescope", lat: -33, lng: 18, altitude: 540 },
    { id: 3, name: "NOAA-19", type: "Weather", lat: 51, lng: 10, altitude: 870 }
  );
  
  // Generate more Starlink satellites (about 30% of total)
  const starlinkCount = Math.floor(count * 0.3);
  for (let i = 0; i < starlinkCount; i++) {
    satellites.push({
      id: satellites.length + 1,
      name: `Starlink-${10000 + i}`,
      type: "Starlink",
      lat: randomCoordinate(-80, 80), // Avoid extreme latitudes
      lng: randomCoordinate(-180, 180),
      altitude: randomAltitude(
        satelliteTypes["Starlink"].min, 
        satelliteTypes["Starlink"].max
      )
    });
  }
  
  // Generate other random satellites
  for (let i = satellites.length; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    satellites.push({
      id: i + 1,
      name: `Sat-${i + 1}`,
      type: type,
      lat: randomCoordinate(-80, 80),
      lng: randomCoordinate(-180, 180),
      altitude: randomAltitude(
        satelliteTypes[type].min, 
        satelliteTypes[type].max
      )
    });
  }
  
  return satellites;
}

// Generate 100 sample satellites
export const sampleSatellites = generateSampleSatellites(100); 