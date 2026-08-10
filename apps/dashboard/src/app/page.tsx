"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import DashboardTabs from "@/components/DashboardTabs";
import QueueTab from "@/components/QueueTab";
import { Bot } from "lucide-react";
import { Truck } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ComplaintMap = dynamic(() => import("@/components/ComplaintMap"), { ssr: false });
const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

type Complaint = {
  id: string;
  status: string;
  category: string | null;
  volume: string | null;
  severity_score: number | null;
  recommended_action: string | null;
  address_text: string | null;
  reported_at: string;
  latitude: number;
  longitude: number;
  rejection_reason?: string | null;
  reporter_name?: string | null;
  reporter_avatar?: string | null;
};

export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"queue" | "map" | "copilot" | "dispatch">("queue");
  const [routeStart, setRouteStart] = useState<{ lat: number; lon: number } | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

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
        .from("complaints_full")
        .select("id, status, category, volume, severity_score, recommended_action, address_text, reported_at, latitude, longitude, rejection_reason, reporter_name, reporter_avatar")
        .order("severity_score", { ascending: false, nullsFirst: false });

      if (!error && data) {
        setComplaints(data);
      }
      setLoading(false);
    }

    init();
  }, []);
  
  const handleResolve = async (complaintId: string, file: File | undefined) => {
  if (!file) return;

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(
    `http://localhost:8000/staff/complaints/${complaintId}/resolve`,
    {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const result = await response.json();
  alert(`Status: ${result.status}\nAI says: ${result.verification.reasoning}`);

  const { data, error } = await supabase
    .from("complaints_full")
    .select("id, status, category, volume, severity_score, recommended_action, address_text, reported_at, latitude, longitude, rejection_reason, reporter_name, reporter_avatar")
    .order("severity_score", { ascending: false, nullsFirst: false });
    
  if (error) console.error("Refetch failed:", error);
  if (data) setComplaints(data);
};

const handleReject = async (complaintId: string) => {
  const reason = prompt("Reason for rejecting this complaint:");
  if (!reason || !reason.trim()) return;

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch(
    `http://localhost:8000/staff/complaints/${complaintId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  const result = await response.json();
  alert(`Status: ${result.status}`);

  const { data } = await supabase
    .from("complaints_full")
    .select("id, status, category, volume, severity_score, recommended_action, address_text, reported_at, latitude, longitude, rejection_reason, reporter_name, reporter_avatar")
    .order("severity_score", { ascending: false, nullsFirst: false });

  if (data) setComplaints(data);
};

const askCopilot = async () => {
  if (!copilotQuestion.trim()) return;

  setCopilotLoading(true);
  setCopilotAnswer("");

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const response = await fetch("http://localhost:8000/copilot/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            question: copilotQuestion,
            officer_lat: position.coords.latitude,
            officer_lon: position.coords.longitude,
          }),
        });
        const data = await response.json();
        setCopilotAnswer(data.answer || "No response received.");
      } catch {
        setCopilotAnswer("Something went wrong reaching the copilot.");
      } finally {
        setCopilotLoading(false);
      }
    },
    () => {
      setCopilotAnswer("Location access is needed to answer distance-based questions.");
      setCopilotLoading(false);
    }
  );
};

const getRoute = async () => {
  if (selectedIds.length === 0) return;

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const response = await fetch("http://localhost:8000/staff/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        complaint_ids: selectedIds,
        start_lat: latitude,
        start_lon: longitude,
      }),
    });

const data = await response.json();
const stops = data.route || [];
setRouteResult(stops);
setRouteStart({ lat: latitude, lon: longitude });

if (stops.length > 0) {
  fetchRoadRoute({ lat: latitude, lon: longitude }, stops);
}
  }, () => {
    alert("Location access is needed to plan a route from your current position.");
  });
};


const fetchRoadRoute = async (start: { lat: number; lon: number }, stops: any[]) => {
  const coords = [
    `${start.lon},${start.lat}`,
    ...stops.map((s) => `${s.longitude},${s.latitude}`),
  ].join(";");

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const geoPoints = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );
      setRouteGeometry(geoPoints);
    }
  } catch (e) {
    setRouteGeometry([]);
  }
};

const toggleSelect = (id: string) => {
  setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

  if (loading) {
    return <div className="p-10 text-white bg-[#0d1b0f] min-h-screen">Loading complaints...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1b0f] text-white p-10">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">SwachhLens — Complaint Queue</h1>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
        className="text-[#6fcf97] border border-[#2e7d4f] rounded-lg px-4 py-2 text-sm"
      >
        Log out
      </button>
    </div>
    <DashboardTabs active={activeTab} onChange={setActiveTab} />

      {complaints.length === 0 && (
        <p className="text-gray-400">No complaints yet.</p>
      )}
{activeTab === "map" && complaints.length > 0 && (
  <div className="mb-8">
    <div className="flex gap-4 mb-4 text-xs text-mist">
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e53935]" /> Critical (75+)</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fb8c00]" /> High (50-74)</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fdd835]" /> Medium (25-49)</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#43a047]" /> Low (0-24)</span>
    </div>
    <ComplaintMap complaints={complaints} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
  </div>
)}
{activeTab==="copilot" && (
<div className="bg-slate rounded-xl p-6 border border-border mb-8">
  <div className="flex items-center gap-2 mb-4">
    <Bot size={20} className="text-mint" />
    <h2 className="text-lg font-body font-bold">Municipal Copilot</h2>
  </div>
  <div className="flex gap-2">
    <input
      type="text"
      value={copilotQuestion}
      onChange={(e) => setCopilotQuestion(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && askCopilot()}
      placeholder="Ask e.g. 'What are the top 3 most urgent complaints?'"
      className="flex-1 bg-ink text-paper rounded-lg p-3 border border-border focus:border-mint outline-none transition-colors"
    />
    <button
      onClick={askCopilot}
      disabled={copilotLoading}
      className="bg-mint text-ink rounded-lg px-5 font-semibold hover:opacity-90 transition-opacity"
    >
      {copilotLoading ? "..." : "Ask"}
    </button>
  </div>
{copilotAnswer && (
  <div className="text-mist text-base mt-4 border-t border-border pt-4 prose prose-invert prose-base max-w-none prose-strong:text-paper prose-headings:text-paper">
    <ReactMarkdown>{copilotAnswer}</ReactMarkdown>
  </div>
)}
</div>
)}
{activeTab==="dispatch" && (
<div className="bg-slate rounded-xl p-6 border border-border mb-8">
  <div className="flex items-center gap-2 mb-4">
    <Truck size={20} className="text-mint" />
    <h2 className="text-lg font-body font-bold">Dispatch Planner</h2>
  </div>
  <p className="text-sm text-gray-400 mb-3">{selectedIds.length} complaint(s) selected</p>
  <button
    onClick={getRoute}
    disabled={selectedIds.length === 0}
    className="bg-[#2e7d4f] text-white rounded-lg px-5 py-2 font-semibold disabled:opacity-50"
  >
    Get Optimized Route
</button>
{routeResult.length > 0 && routeStart && (
  <>
    <div className="mb-4 mt-4">
      <RouteMap stops={routeResult} startLat={routeStart.lat} startLon={routeStart.lon} roadGeometry={routeGeometry} />
    </div>
    <ol className="space-y-2">
      {routeResult.map((stop, i) => (
        <li key={stop.id} className="text-sm text-mist">
          {i + 1}. {stop.category?.replace(/_/g, " ")} — {stop.address || "Unknown location"}
          {" "}({stop.distance_from_previous_m}m from previous)
        </li>
      ))}
    </ol>
  </>
)}
</div>
)}
{activeTab === "queue" && (
        <QueueTab
          complaints={complaints}
          onResolve={handleResolve}
          onReject={handleReject}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
{selectedIds.length > 0 && activeTab !== "dispatch" && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate border border-border rounded-full shadow-2xl shadow-black/40 px-6 py-3 flex items-center gap-4">
    <span className="text-sm text-paper">{selectedIds.length} selected</span>
    <button
      onClick={() => setActiveTab("dispatch")}
      className="bg-mint text-ink text-sm font-semibold rounded-full px-4 py-1.5 hover:opacity-90 transition-opacity"
    >
      View Optimized Route →
    </button>
  </div>
)}
    </div>
  );
}