'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { TleData } from '@/app/api/tle/route';
import { 
  parseTle, 
  calculateSatellitePosition, 
  calculateSatellitePositions,
  getSatelliteColor,
  SatellitePosition 
} from '@/lib/satelliteUtils';

// Define props interface
interface CesiumViewerProps {
  tleData: TleData[] | null;
}

// Create a component that will only be loaded on the client side
const CesiumViewer: React.FC<CesiumViewerProps> = ({ tleData }: CesiumViewerProps) => {
  // Refs for DOM container and Cesium viewer
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any | null>(null);
  
  // Ref to store and track satellite entities
  const satelliteEntitiesRef = useRef<Map<string, any>>(new Map());
  
  // Ref to store parsed satellite records for propagation
  const satelliteRecordsRef = useRef<Map<string, any>>(new Map());
  
  // State to track if satellites have been loaded
  const [satellitesLoaded, setSatellitesLoaded] = useState<boolean>(false);
  // State to track if Cesium is loaded
  const [cesiumLoaded, setCesiumLoaded] = useState<boolean>(false);
  // Store Cesium namespace
  const [Cesium, setCesium] = useState<any>(null);

  // Load Cesium dynamically only on client side
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadCesium = async () => {
      try {
        // Dynamically import Cesium
        const cesiumModule = await import('cesium');
        // Also import the CSS
        await import('cesium/Build/Cesium/Widgets/widgets.css');
        // Store Cesium namespace
        setCesium(cesiumModule);
        setCesiumLoaded(true);
      } catch (error) {
        console.error('Failed to load Cesium:', error);
      }
    };

    loadCesium();
  }, []);

  // Initialize Cesium viewer once Cesium is loaded
  useEffect(() => {
    if (!cesiumLoaded || !Cesium || typeof window === 'undefined' || !cesiumContainer.current || viewerRef.current) {
      return;
    }

    // Set the base URL for Cesium assets
    window.CESIUM_BASE_URL = process.env.NEXT_PUBLIC_CESIUM_BASE_URL || '/cesium/';

    // Initialize the Cesium viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
    });

    // Set up an initial view of Earth
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 25000000), // 25,000 km altitude
      orientation: {
        heading: 0,
        pitch: -Cesium.Math.PI_OVER_TWO, // Looking straight down
        roll: 0
      }
    });

    viewerRef.current = viewer;

    return () => {
      // Cleanup when component unmounts
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        console.log('Cesium Viewer destroyed');
      }
    };
  }, [cesiumLoaded, Cesium]);

  // Effect to handle TLE data changes and create/update satellite entities
  useEffect(() => {
    if (!viewerRef.current || !tleData || !Cesium) {
      return;
    }

    const viewer = viewerRef.current;
    
    // Clear existing satellite records when TLE data changes
    satelliteRecordsRef.current.clear();
    
    // Process TLEs and add satellites to the map
    const processTleData = () => {
      console.log(`Processing ${tleData.length} TLE entries`);
      
      // Track which satellites we've processed in this update
      const processedSatellites = new Set<string>();
      
      // Current time for propagation
      const currentTime = viewer.clock.currentTime;
      
      // Calculate positions for all satellites
      const satellitePositions = calculateSatellitePositions(tleData, currentTime);
      
      // Update or create entities for each satellite position
      for (const satPosition of satellitePositions) {
        const { id, name, position, isValid } = satPosition;
        
        if (!isValid) {
          console.warn(`Invalid position for satellite ${name}, skipping visualization`);
          continue;
        }
        
        processedSatellites.add(id);
        
        // Store the satellite record for later updates
        try {
          const matchingTle = tleData.find((tle: TleData) => tle.name === name);
          if (matchingTle) {
            const satRec = parseTle(matchingTle);
            satelliteRecordsRef.current.set(id, satRec);
          }
        } catch (error) {
          console.error(`Error storing satellite record for ${name}:`, error);
        }
        
        // Get entity color based on satellite name
        const color = getSatelliteColor(name);
        
        // Check if we already have an entity for this satellite
        if (satelliteEntitiesRef.current.has(id)) {
          // Update existing entity
          const entity = satelliteEntitiesRef.current.get(id)!;
          entity.position = new Cesium.ConstantPositionProperty(position);
        } else {
          // Create a new entity
          const entity = viewer.entities.add({
            id: id,
            name: name,
            position: position,
            point: {
              pixelSize: 5,
              color: color,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1
            },
            label: {
              text: name,
              font: '10px Helvetica',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000000),
              eyeOffset: new Cesium.Cartesian3(0, 0, -10000)
            }
          });
          
          // Store the entity in our ref
          satelliteEntitiesRef.current.set(id, entity);
        }
      }
      
      // Remove entities for satellites no longer in the data
      for (const [id, entity] of satelliteEntitiesRef.current.entries()) {
        if (!processedSatellites.has(id)) {
          viewer.entities.remove(entity);
          satelliteEntitiesRef.current.delete(id);
          satelliteRecordsRef.current.delete(id);
        }
      }
      
      // Set loaded state
      if (!satellitesLoaded && satelliteEntitiesRef.current.size > 0) {
        setSatellitesLoaded(true);
        console.log(`Loaded ${satelliteEntitiesRef.current.size} satellite entities`);
      }
    };
    
    // Process initial TLE data
    processTleData();
    
  }, [tleData, satellitesLoaded, Cesium]);
  
  // Effect to set up real-time updates for satellite positions
  useEffect(() => {
    if (!viewerRef.current || !satellitesLoaded || !tleData || tleData.length === 0 || !Cesium) {
      return;
    }
    
    const viewer = viewerRef.current;
    
    // Set up interval for position updates
    const updateInterval = setInterval(() => {
      if (!viewer || !viewer.clock) return;
      
      const currentTime = viewer.clock.currentTime;
      
      // Update all satellite positions
      for (const [id, satRec] of satelliteRecordsRef.current.entries()) {
        const entity = satelliteEntitiesRef.current.get(id);
        if (!entity) continue;
        
        try {
          // Calculate new position
          const position = calculateSatellitePosition(satRec, currentTime, id);
          
          if (position.isValid) {
            // Update entity position
            entity.position = new Cesium.ConstantPositionProperty(position.position);
          }
        } catch (error) {
          console.error(`Error updating position for ${id}:`, error);
        }
      }
    }, 1000); // Update every second
    
    // Cleanup the interval on unmount
    return () => {
      clearInterval(updateInterval);
    };
  }, [tleData, satellitesLoaded, Cesium]);

  return (
    <div
      className="w-full h-full"
      ref={cesiumContainer}
    />
  );
};

// Export a dynamic component with SSR disabled
export default dynamic(() => Promise.resolve(CesiumViewer), {
  ssr: false
}); 