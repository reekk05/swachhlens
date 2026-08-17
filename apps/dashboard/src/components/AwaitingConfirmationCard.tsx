"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

type Complaint = {
  id: string;
  category: string | null;
  address_text: string | null;
  reporter_name?: string | null;
  ai_verification_note?: string | null;
};

export default function AwaitingConfirmationCard({
  complaint,
  onConfirm,
}: {
  complaint: Complaint;
  onConfirm: (id: string, approve: boolean) => void;
}) {
  const [photos, setPhotos] = useState<{ before_photo_url: string | null; after_photo_url: string | null } | null>(null);
  const [enlarged, setEnlarged] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/complaints/${complaint.id}/photos`)
      .then((res) => res.json())
      .then(setPhotos)
      .catch(() => {});
  }, [complaint.id]);

  return (
    <div className="bg-slate rounded-xl p-5 border border-border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-lg font-semibold capitalize">{complaint.category?.replace(/_/g, " ") || "Unknown"}</p>
          <p className="text-sm text-mist">{complaint.address_text || "Location pending"}</p>
          {complaint.reporter_name && (
            <p className="text-xs text-mist mt-1">Reported by {complaint.reporter_name}</p>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#F4A73B]/20 text-[#F4A73B]">
          Awaiting Confirmation
        </span>
      </div>

      {photos && (
        <div className="flex gap-4 mb-4">
          {photos.before_photo_url && (
            <div>
              <p className="text-xs text-mist mb-1.5 uppercase tracking-wide font-medium">Before</p>
              <img
                src={photos.before_photo_url}
                onClick={() => setEnlarged(photos.before_photo_url)}
                className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border"
              />
            </div>
          )}
          {photos.after_photo_url && (
            <div>
              <p className="text-xs text-mist mb-1.5 uppercase tracking-wide font-medium">After</p>
              <img
                src={photos.after_photo_url}
                onClick={() => setEnlarged(photos.after_photo_url)}
                className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border"
              />
            </div>
          )}
        </div>
      )}

      {complaint.ai_verification_note && (
        <div className="bg-ink rounded-lg p-3 mb-4 text-sm text-mist">
          <span className="text-mint font-medium">AI note: </span>
          {complaint.ai_verification_note}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onConfirm(complaint.id, true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-mint text-ink rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <CheckCircle2 size={16} /> Confirm Resolved
        </button>
        <button
          onClick={() => onConfirm(complaint.id, false)}
          className="flex-1 flex items-center justify-center gap-1.5 text-[#F4A73B] border border-[#F4A73B]/40 rounded-lg py-2.5 text-sm font-medium hover:bg-[#F4A73B]/10 transition-colors"
        >
          <RotateCcw size={16} /> Send Back
        </button>
      </div>

      {enlarged && (
        <div onClick={() => setEnlarged(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer">
          <img src={enlarged} className="max-w-3xl max-h-[85vh] rounded-lg" />
        </div>
      )}
    </div>
  );
}