"use client";

import { useState } from "react";

export default function RejectModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-slate border border-border rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-paper font-medium mb-1">Reject Complaint</h3>
        <p className="text-mist text-sm mb-4">Please provide a reason. This will be visible to the citizen.</p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Duplicate report, not a valid waste issue..."
          rows={3}
          className="w-full bg-ink text-paper rounded-lg p-3 border border-border focus:border-mint outline-none resize-none text-sm"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 text-mist border border-border rounded-lg py-2 text-sm hover:text-paper transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 bg-signal text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}