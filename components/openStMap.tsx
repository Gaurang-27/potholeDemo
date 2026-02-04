"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

type LocationType = {
  lat: number;
  lng: number;
  id: string;
};

// JSONBin configuration
const JSONBIN_BIN_ID = "69837cafd0ea881f40a0c846";
const JSONBIN_API_KEY = "$2a$10$WHkxVjoKDRV5cvbo9BgykeZL5X5Z.P1IYhOdKCI/KlXX9t4Q/lu2a";

// Function to calculate distance between two coordinates (in meters)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function Map() {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [reportedLocations, setReportedLocations] = useState<LocationType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyPotholes, setNearbyPotholes] = useState<LocationType[]>([]);

  // Distance margin in meters (50 meters = approx 0.0005 degrees)
  const DISTANCE_MARGIN = 20; // 50 meters radius

  // Load potholes from JSONBin
  useEffect(() => {
    loadPotholes();
  }, []);

  const loadPotholes = async () => {
    try {
      const response = await fetch(
        `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
        {
          headers: {
            'X-Master-Key': JSONBIN_API_KEY,
          },
        }
      );
      const data = await response.json();
      setReportedLocations(data.record.potholes || []);
    } catch (err) {
      console.error('Failed to load potholes:', err);
    }
  };

  const savePotholes = async (potholes: LocationType[]) => {
    setLoading(true);
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
        },
        body: JSON.stringify({ potholes }),
      });
    } catch (err) {
      console.error('Failed to save potholes:', err);
    }
    setLoading(false);
  };

  // Check for nearby potholes whenever location changes
  useEffect(() => {
    if (currentLocation && reportedLocations.length > 0) {
      const nearby = reportedLocations.filter((pothole) => {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          pothole.lat,
          pothole.lng
        );
        return distance <= DISTANCE_MARGIN;
      });
      setNearbyPotholes(nearby);
    } else {
      setNearbyPotholes([]);
    }
  }, [currentLocation, reportedLocations]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 100000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentLocation) {
      alert("Location not available yet");
      return;
    }

    const newLocation: LocationType = {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedPotholes = [...reportedLocations, newLocation];
    setReportedLocations(updatedPotholes);
    await savePotholes(updatedPotholes);
    alert("Pothole reported!");
  };

  const handleRemoveNearby = async () => {
    if (nearbyPotholes.length === 0) {
      alert("No potholes nearby to remove!");
      return;
    }

    if (confirm(`Remove ${nearbyPotholes.length} pothole(s) near your location?`)) {
      const nearbyIds = nearbyPotholes.map((p) => p.id);
      const updatedPotholes = reportedLocations.filter(
        (pothole) => !nearbyIds.includes(pothole.id)
      );
      
      setReportedLocations(updatedPotholes);
      await savePotholes(updatedPotholes);
      alert(`${nearbyPotholes.length} pothole(s) removed!`);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Clear all potholes?")) {
      setReportedLocations([]);
      await savePotholes([]);
    }
  };

  if (!currentLocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading map...</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <style jsx global>{`
        .leaflet-container {
          height: 80vh;
          width: 100%;
          z-index: 0;
        }
        .leaflet-tile-pane { z-index: 0; }
        .leaflet-marker-pane { z-index: 600; }
        .leaflet-popup-pane { z-index: 700; }
        .leaflet-control { z-index: 800; }
      `}</style>

      <MapContainer
        center={[currentLocation.lat, currentLocation.lng]}
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current Location Marker */}
        <Marker 
          position={[currentLocation.lat, currentLocation.lng]}
          icon={L.divIcon({
            html: '<div style="font-size: 30px;">📍</div>',
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })}
        >
          <Popup>Your Location</Popup>
        </Marker>

        {/* Pothole Markers */}
        {reportedLocations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>Pothole 🕳️</Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="p-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        {/* Nearby Potholes Alert */}
        {nearbyPotholes.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
            <p className="text-yellow-800 font-semibold">
              ⚠️ {nearbyPotholes.length} pothole(s) detected within {DISTANCE_MARGIN}m of your location!
            </p>
          </div>
        )}
        
        <div className="flex gap-4 flex-wrap">
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={loading}
              className="p-5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Report Pothole"}
            </button>
          </form>

          {nearbyPotholes.length > 0 && (
            <button
              onClick={handleRemoveNearby}
              disabled={loading}
              className="p-5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              Remove Nearby ({nearbyPotholes.length})
            </button>
          )}

          {reportedLocations.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="p-5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>

        {reportedLocations.length > 0 && (
          <p className="mt-4 text-gray-600">
            {reportedLocations.length} pothole(s) reported
          </p>
        )}
      </div>
    </div>
  );
}