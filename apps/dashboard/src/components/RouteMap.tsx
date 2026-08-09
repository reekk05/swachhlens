"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Stop = {
  id: string;
  latitude: number;
  longitude: number;
  category: string | null;
  address: string | null;
  distance_from_previous_m: number;
};

function numberedIcon(num: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#3EE89A;color:#14171C;width:28px;height:28px;border-radius:100%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #14171C;">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function RouteMap({
  stops,
  startLat,
  startLon,
  roadGeometry,
}: {
  stops: Stop[];
  startLat: number;
  startLon: number;
  roadGeometry: [number, number][];
}) {
  if (stops.length === 0) return null;

  const fallbackPositions: [number, number][] = [
    [startLat, startLon],
    ...stops.map((s) => [s.latitude, s.longitude] as [number, number]),
  ];

  const linePositions = roadGeometry.length > 0 ? roadGeometry : fallbackPositions;

  return (
    <MapContainer center={[startLat, startLon]} zoom={13} style={{ height: "400px", width: "100%", borderRadius: "12px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <Polyline
        positions={linePositions}
        pathOptions={
          roadGeometry.length > 0
            ? { color: "#3EE89A", weight: 4 }
            : { color: "#3EE89A", weight: 3, dashArray: "6 6" }
        }
      />      {stops.map((stop, i) => (
        <Marker key={stop.id} position={[stop.latitude, stop.longitude]} icon={numberedIcon(i + 1)}>
          <Popup>
            <strong>Stop {i + 1}</strong>
            <br />
            {stop.category?.replace(/_/g, " ")}
            <br />
            {stop.address || "Unknown location"}
            <br />
            {stop.distance_from_previous_m}m from previous
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}