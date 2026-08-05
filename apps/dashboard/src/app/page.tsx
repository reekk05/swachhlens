"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Complaint = {
  id: string;
  status: string;
  category: string | null;
  volume: string | null;
  severity_score: number | null;
  recommended_action: string | null;
  address_text: string | null;
  reported_at: string;
};

export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("complaints")
        .select("id, status, category, volume, severity_score, recommended_action, address_text, reported_at")
        .order("severity_score", { ascending: false, nullsFirst: false });

      if (!error && data) {
        setComplaints(data);
      }
      setLoading(false);
    }

    init();
  }, []);

  if (loading) {
    return <div className="p-10 text-white bg-[#0d1b0f] min-h-screen">Loading complaints...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1b0f] text-white p-10">
      <h1 className="text-3xl font-bold mb-6">SwachhLens — Complaint Queue</h1>

      {complaints.length === 0 && (
        <p className="text-gray-400">No complaints yet.</p>
      )}

      <div className="space-y-4">
        {complaints.map((c) => (
          <div key={c.id} className="bg-[#132618] rounded-xl p-5 border border-[#2e7d4f]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold capitalize">
                  {c.category?.replace(/_/g, " ") || "Pending classification"}
                </p>
                <p className="text-sm text-gray-400">{c.address_text || "Location pending"}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#6fcf97]">
                  {c.severity_score ?? "—"}
                </p>
                <p className="text-xs text-gray-400 uppercase">{c.status}</p>
              </div>
            </div>
            {c.recommended_action && (
              <p className="text-sm text-gray-300 mt-3 border-t border-[#2e7d4f] pt-3">
                {c.recommended_action}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}