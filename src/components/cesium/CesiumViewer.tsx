'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Cesium from 'cesium';
// Import types for Cesium - adjust path if necessary based on your setup or types installation
// If using @types/cesium, it might be implicitly available or require a different import
// import type { Viewer } from 'cesium'; 
import 'cesium/Build/Cesium/Widgets/widgets.css';
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

const CesiumViewer: React.FC<CesiumViewerProps> = ({ tleData }: CesiumViewerProps) => {
  // Refs for DOM container and Cesium viewer
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  
  // Ref to store and track satellite entities
  const satelliteEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  
  // Ref to store parsed satellite records for propagation
  const satelliteRecordsRef = useRef<Map<string, any>>(new Map());
  
  // State to track if satellites have been loaded
  const [satellitesLoaded, setSatellitesLoaded] = useState<boolean>(false);

  // Initialize Cesium viewer
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (cesiumContainer.current && !viewerRef.current) {
      // Set the base URL for Cesium assets
      (window as any).CESIUM_BASE_URL = process.env.NEXT_PUBLIC_CESIUM_BASE_URL || '/cesium/';

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
    }

    return () => {
      // Cleanup when component unmounts
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        console.log('Cesium Viewer destroyed');
      }
    };
  }, []);

  // Effect to handle TLE data changes and create/update satellite entities
  useEffect(() => {
    if (!viewerRef.current || !tleData) {
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
    
  }, [tleData, satellitesLoaded]);
  
  // Effect to set up real-time updates for satellite positions
  useEffect(() => {
    if (!viewerRef.current || !satellitesLoaded || !tleData || tleData.length === 0) {
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
  }, [tleData, satellitesLoaded]);

  return (
    <div
      className="w-full h-full"
      ref={cesiumContainer}
    />
  );
};

export default CesiumViewer; 