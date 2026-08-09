"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapComplaint = {
  id: string;
  latitude: number;
  longitude: number;
  category: string | null;
  severity_score: number | null;
  status: string;
  address_text: string | null;
};

function severityColor(score: number | null) {
  if (score === null) return "#888888";
  if (score >= 75) return "#e53935";
  if (score >= 50) return "#fb8c00";
  if (score >= 25) return "#fdd835";
  return "#43a047";
}

export default function ComplaintMap({
  complaints,
  selectedIds,
  onToggleSelect,
}: {
  complaints: MapComplaint[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}) {  const center: [number, number] =
    complaints.length > 0
      ? [complaints[0].latitude, complaints[0].longitude]
      : [20.2961, 85.8245];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "500px", width: "100%", borderRadius: "12px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
{complaints.map((c) => {
  const isSelected = selectedIds.includes(c.id);
  return (
    <CircleMarker
      key={c.id}
      center={[c.latitude, c.longitude]}
      radius={isSelected ? 13 : 10}
      pathOptions={{
        color: isSelected ? "#3EE89A" : severityColor(c.severity_score),
        fillColor: severityColor(c.severity_score),
        fillOpacity: 0.7,
        weight: isSelected ? 3 : 1,
      }}
      eventHandlers={{ click: () => onToggleSelect(c.id) }}
    >          <Popup>
            <strong>{c.category?.replace(/_/g, " ") || "Pending"}</strong>
            <br />
            Severity: {c.severity_score ?? "—"}
            <br />
            {c.address_text || "Location pending"}
            <br />
Status: {c.status}
        <br />
        <em>{isSelected ? "Selected — click to deselect" : "Click to select for dispatch"}</em>
      </Popup>
    </CircleMarker>
  );
})}    </MapContainer>
  );
}