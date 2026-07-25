"use client";

import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { MapPhoto } from "./SiteMap";
import "leaflet/dist/leaflet.css";

const KIND_COLORS: Record<string, string> = {
  BEFORE: "#64748B",
  PROGRESS: "#0EA5E9",
  AFTER: "#059669",
  DEFECT: "#DC2626",
};

const projectIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#0A1628;border:2px solid #0EA5E9;box-shadow:0 0 0 2px white"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

export function SiteMapInner({
  lat,
  lng,
  photos,
  onSelect,
}: {
  lat: number;
  lng: number;
  photos: MapPhoto[];
  onSelect: (p: MapPhoto) => void;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <InvalidateSize />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={projectIcon}>
        <Popup>Project site</Popup>
      </Marker>
      {photos.map((photo) => (
        <CircleMarker
          key={photo.id}
          center={[photo.lat, photo.lng]}
          radius={6}
          pathOptions={{
            color: "#fff",
            weight: 1,
            fillColor: KIND_COLORS[photo.kind] ?? "#0EA5E9",
            fillOpacity: 0.9,
          }}
          eventHandlers={{
            click: () => onSelect(photo),
          }}
        />
      ))}
    </MapContainer>
  );
}
