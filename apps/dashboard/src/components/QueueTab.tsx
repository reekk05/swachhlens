"use client";

import { useState, useEffect } from "react";

type Complaint = {
  id: string;
  status: string;
  category: string | null;
  volume: string | null;
  severity_score: number | null;
  recommended_action: string | null;
  address_text: string | null;
  reported_at: string;
  reporter_name?: string | null;
  reporter_avatar?: string | null;
  rejection_reason?: string | null;
};

const categoryColors: Record<string, string> = {
  overflowing_bin: "#F4A73B",
  illegal_dump: "#E14B4B",
  plastic: "#4FB0E8",
  construction_debris: "#B08968",
  organic: "#8BC34A",
  e_waste: "#B388EB",
  hazardous: "#E14B4B",
  drain_blockage: "#4DD0E1",
};

const categoryIcons: Record<string, string> = {
  overflowing_bin: "🗑️",
  illegal_dump: "⚠️",
  plastic: "♻️",
  construction_debris: "🧱",
  organic: "🍃",
  e_waste: "🔌",
  hazardous: "☣️",
  drain_blockage: "🚰",
};

const statusStyles: Record<string, string> = {
  pending: "bg-mist/20 text-mist",
  verified: "bg-mint/20 text-mint",
  dispatched: "bg-[#4FB0E8]/20 text-[#4FB0E8]",
  in_progress: "bg-[#F4A73B]/20 text-[#F4A73B]",
  resolved: "bg-mint/20 text-mint",
  rejected: "bg-signal/20 text-signal",
};

function ResolvedPhotos({ complaintId }: { complaintId: string }) {
  const [photos, setPhotos] = useState<{
    before_photo_url: string | null;
    after_photo_url: string | null;
  } | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/complaints/${complaintId}/photos`)
      .then((res) => res.json())
      .then(setPhotos)
      .catch((err) => console.error("Failed to fetch photos", err));
  }, [complaintId]);

  if (!photos) return null;

  return (
    <div className="flex gap-3 mt-3">
      {photos.before_photo_url && (
        <div>
          <p className="text-xs text-mist mb-1">Before</p>
          <img
            src={photos.before_photo_url}
            alt="Condition before resolution"
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
      )}
      {photos.after_photo_url && (
        <div>
          <p className="text-xs text-mist mb-1">After</p>
          <img
            src={photos.after_photo_url}
            alt="Condition after resolution"
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default function QueueTab({
  complaints,
  onResolve,
  onReject,
  selectedIds,
  onToggleSelect,
}: {
  complaints: Complaint[];
  onResolve: (id: string, file: File | undefined) => void;
  onReject: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}) {
  if (complaints.length === 0) {
    return <p className="text-mist">No complaints yet.</p>;
  }

  return (
    <div>
      {/* Category Legend */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-mist">
        {Object.entries(categoryColors).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {categoryIcons[key]} {key.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.map((c) => (
          <div
            key={c.id}
            className="bg-slate rounded-xl p-5 border-l-4"
            style={{
              borderLeftColor: categoryColors[c.category || ""] || "#8B93A1",
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold capitalize">
                  {c.category
                    ? `${categoryIcons[c.category] || ""} ${c.category.replace(
                        /_/g,
                        " "
                      )}`
                    : "Pending classification"}
                </p>
                <p className="text-sm text-mist">
                  {c.address_text || "Location pending"}
                </p>
                <p className="text-xs text-mist mt-1">
                  {new Date(c.reported_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {c.reporter_name && (
                  <div className="flex items-center gap-2 mt-2">
                    {c.reporter_avatar ? (
                      <img
                        src={c.reporter_avatar}
                        className="w-5 h-5 rounded-full"
                        alt={`${c.reporter_name}'s avatar`}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-ink" />
                    )}
                    <span className="text-xs text-mist">
                      Reported by {c.reporter_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-display text-mint">
                  {c.severity_score ?? "—"}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 ${
                    statusStyles[c.status] || "bg-mist/20 text-mist"
                  }`}
                >
                  {c.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {c.recommended_action && (
              <p className="text-sm text-mist mt-3 border-t border-border pt-3">
                {c.recommended_action}
              </p>
            )}

            {c.status === "rejected" && c.rejection_reason && (
              <p className="text-sm text-signal mt-3 border-t border-border pt-3">
                Rejected: {c.rejection_reason}
              </p>
            )}

            {c.status === "resolved" && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm text-mint">
                  <span>✓ Verified and resolved by AI</span>
                </div>
                {/* 
                  Added the missing component here so photos 
                  actually render for resolved complaints!
                */}
                <ResolvedPhotos complaintId={c.id} />
              </div>
            )}

            {c.status !== "resolved" && c.status !== "rejected" && (
              <div className="flex items-center gap-3 mt-4 border-t border-border pt-4">
                <label className="flex items-center gap-2 text-sm text-mist cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => onToggleSelect(c.id)}
                    className="accent-mint w-4 h-4"
                  />
                  Select for dispatch
                </label>

                <div className="flex-1" />

                <button
                  onClick={() => onReject(c.id)}
                  className="text-signal text-sm font-medium border border-signal/30 rounded-lg px-4 py-2 hover:bg-signal/10 transition-colors"
                >
                  Reject
                </button>

                <label className="text-ink text-sm font-medium bg-mint rounded-lg px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer">
                  Mark Resolved
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onResolve(c.id, e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}