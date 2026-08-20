"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import DashboardTabs from "@/components/DashboardTabs";
import QueueTab from "@/components/QueueTab";
import { Truck } from "lucide-react";
import { ToastContainer, ToastData } from "@/components/Toast";
import RejectModal from "@/components/RejectModal";
import CopilotWidget from "@/components/CopilotWidget";
import WorkersTab from "@/components/WorkersTab";
import AwaitingConfirmationCard from "@/components/AwaitingConfirmationCard";
import CommandCenterTab from "@/components/CommandCenterTab";

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
  ai_verification_note?: string | null;
  estimated_cleanup_minutes?: number | null;
  workers_needed?: number | null;
  report_count?: number | null;
};

export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"queue" | "active" | "map" | "command" | "dispatch"| "workers" >("queue");  const [routeStart, setRouteStart] = useState<{ lat: number; lon: number } | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<{
    id: string;
    full_name: string;
    has_location: boolean;
    last_seen: string | null;
    is_active: boolean;
  }[]>([]);

  const [workerPositions, setWorkerPositions] = useState<
    {
      worker_id: string;
      latitude: number;
      longitude: number;
    }[]
  >([]);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerEmail, setNewWorkerEmail] = useState("");
  const [newWorkerPassword, setNewWorkerPassword] = useState("");

  const showToast = (type: ToastData["type"], title: string, message?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const router = useRouter();
  const supabase = createClient();
  const createWorker = async () => {
    if (!newWorkerName.trim() || !newWorkerEmail.trim() || !newWorkerPassword.trim()) {
      showToast("error", "Please fill in all fields");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const response = await fetch("http://localhost:8000/staff/workers/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        full_name: newWorkerName,
        email: newWorkerEmail,
        password: newWorkerPassword,
      }),
    });

    if (response.ok) {
      showToast("success", "Worker account created", `${newWorkerName} can now log in on mobile`);
      setNewWorkerName("");
      setNewWorkerEmail("");
      setNewWorkerPassword("");
      setShowAddWorker(false);
      fetchWorkers();
    } else {
      const data = await response.json();
      showToast("error", "Failed to create worker", data.detail);
    }
  };

  const fetchWorkers = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch("http://localhost:8000/staff/workers", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) {
    const data = await response.json();
    setWorkers(data);
  }
};

const fetchWorkerPositions = async () => {
  const { data, error } = await supabase
    .from("worker_locations")
    .select("worker_id, latitude, longitude");

  if (!error && data) {
    setWorkerPositions(data);
  }
};

const suggestWorker = async () => {
  if (selectedIds.length === 0) return;

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch("http://localhost:8000/staff/suggest-worker", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(selectedIds),
  });

  if (response.ok) {
    const data = await response.json();
    if (data.worker_id) {
      setSelectedWorkerId(data.worker_id);
      showToast("info", `Suggested: ${data.full_name}`, `${Math.round(data.distance_m / 1000)}km away — nearest available worker`);
    }
  }
};

const refreshComplaints = async () => {
  const { data: complaintView, error: viewError } = await supabase
    .from("complaints_full")
    .select(
      "id, status, category, volume, severity_score, recommended_action, address_text, reported_at, latitude, longitude, rejection_reason, reporter_name, reporter_avatar, ai_verification_note"
    )
    .order("severity_score", { ascending: false, nullsFirst: false });

  if (viewError || !complaintView) {
    console.error("Failed to fetch complaints:", viewError);
    return;
  }

  const { data: operationalData, error: operationalError } = await supabase
    .from("complaints")
    .select(
      "id, estimated_cleanup_minutes, workers_needed, report_count"
    );

  if (operationalError || !operationalData) {
    console.error(
      "Failed to fetch complaint operational data:",
      operationalError
    );

    setComplaints(complaintView);
    return;
  }

  const operationalById = new Map(
    operationalData.map((row) => [row.id, row])
  );

  const merged = complaintView.map((complaint) => ({
    ...complaint,
    ...operationalById.get(complaint.id),
  }));

  setComplaints(merged);
};

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }
      const { data: staffRow } = await supabase
        .from("staff_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!staffRow || staffRow.role === "field_officer") {
        await supabase.auth.signOut();
        router.push("/login?error=field-worker");
        return;
      }

      await refreshComplaints();
      fetchWorkers();
      fetchWorkerPositions();
      setLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
  if (activeTab === "dispatch" && selectedIds.length > 0 && !selectedWorkerId) {
    suggestWorker();
  }
}, [activeTab]);
  
useEffect(() => {
  const interval = setInterval(() => {
    refreshComplaints();
    fetchWorkerPositions();
  }, 15000);

  return () => clearInterval(interval);
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
  if (result.status === "resolved") {
    showToast("success", "Complaint resolved", result.verification.reasoning);
  } else {
    showToast("info", "Not yet resolved — needs more work", result.verification.reasoning);
  }
await refreshComplaints();
};
const handleReject = (complaintId: string) => {
  setRejectingId(complaintId);
};
const confirmReject = async (reason: string) => {
  if (!rejectingId) return;

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch(
    `http://localhost:8000/staff/complaints/${rejectingId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (response.ok) {
    showToast("success", "Complaint rejected", reason);
  } else {
    showToast("error", "Something went wrong");
  }

  setRejectingId(null);

await refreshComplaints();
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
        setCopilotQuestion("");
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

const confirmDispatch = async () => {

  if (!selectedWorkerId) {
  showToast("error", "Please select a field worker first");
  return;
}

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch("http://localhost:8000/staff/complaints/dispatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ complaint_ids: selectedIds, worker_id: selectedWorkerId }),
  });

  if (response.ok) {
    showToast("success", "Crews dispatched", `${selectedIds.length} complaint(s) sent for cleanup`);
    setSelectedIds([]);
    setRouteResult([]);
    setActiveTab("active");
  } else {
    showToast("error", "Dispatch failed");
  }

await refreshComplaints();
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
} catch {
  setRouteGeometry([]);
}
};

const toggleSelect = (id: string) => {
  setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const handleConfirmCompletion = async (complaintId: string, approve: boolean) => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch(`http://localhost:8000/staff/complaints/${complaintId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ approve }),
  });

  if (response.ok) {
    showToast(
      approve ? "success" : "info",
      approve ? "Complaint resolved" : "Sent back to worker",
      approve ? "Citizen's stats have been updated" : "Worker will see this again in their stops"
    );
  } else {
    showToast("error", "Something went wrong");
  }

await refreshComplaints();
};

  if (loading) {
    return <div className="p-10 text-white bg-[#0d1b0f] min-h-screen">Loading complaints...</div>;
  }
const queueComplaints = complaints.filter((c) => c.status === "pending" || c.status === "verified");
const activeComplaints = complaints.filter((c) => c.status === "dispatched" || c.status === "in_progress");
const awaitingComplaints = complaints.filter((c) => c.status === "awaiting_confirmation");
  return (
    <div className="min-h-screen bg-[#0d1b0f] text-white p-10">
    <div className="flex justify-between items-center mb-6">
<img
  src="/swachhlens-logo.svg"
  alt="SwachhLens"
  className="h-25 w-auto"
/> 
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
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#e53935]" />
        Critical (75+)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#fb8c00]" />
        High (50-74)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#fdd835]" />
        Medium (25-49)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#43a047]" />
        Low (0-24)
      </span>
    </div>

    <ComplaintMap
      complaints={complaints}
      selectedIds={selectedIds}
      onToggleSelect={toggleSelect}
    />
  </div>
)}

{activeTab === "command" && (
  <CommandCenterTab
    complaints={complaints}
    workers={workers}
    workerPositions={workerPositions}
  />
)}

{activeTab === "dispatch" && (
  <div className="bg-slate rounded-xl p-6 border border-border mb-8">
  <div className="flex items-center gap-2 mb-4">
    <Truck size={20} className="text-mint" />
    <h2 className="text-lg font-body font-bold">Dispatch Planner</h2>
  </div>
  <p className="text-sm text-gray-400 mb-3">{selectedIds.length} complaint(s) selected</p>
  
<select
  value={selectedWorkerId}
  onChange={(e) => setSelectedWorkerId(e.target.value)}
  className="w-full bg-ink text-paper rounded-lg p-3 mb-3 border border-border focus:border-mint outline-none"
>
  <option value="">Select a field worker...</option>
  {workers.map((w) => (
    <option key={w.id} value={w.id}>
      {w.full_name} {w.has_location ? "📍" : "(no location yet)"}
    </option>
  ))}
</select>

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
    <li key={stop.id} className="flex items-center justify-between text-sm text-mist bg-ink rounded-lg px-3 py-2">
      <span>
        {i + 1}. {stop.category?.replace(/_/g, " ")} — {stop.address || "Unknown location"}
        {" "}({stop.distance_from_previous_m}m from previous)
      </span>
      <button
        onClick={() => {
          setRouteResult((prev) => prev.filter((s) => s.id !== stop.id));
          setSelectedIds((prev) => prev.filter((id) => id !== stop.id));
        }}
        className="text-signal text-xs hover:opacity-70 ml-3"
      >
        Remove
      </button>
    </li>
  ))}
</ol>    <button
      onClick={confirmDispatch}
      className="w-full mt-4 bg-mint text-ink rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity"
    >
      Confirm Dispatch — Send {selectedIds.length} Crew{selectedIds.length !== 1 ? "s" : ""}
    </button>
  </>
)}
</div>
)}
{activeTab === "queue" && (
        <QueueTab
          complaints={queueComplaints}
          onResolve={handleResolve}
          onReject={handleReject}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
)}

{activeTab === "workers" && (
  <WorkersTab
    workers={workers}
    showAddWorker={showAddWorker}
    onToggleAddWorker={setShowAddWorker}
    newWorkerName={newWorkerName}
    onNameChange={setNewWorkerName}
    newWorkerEmail={newWorkerEmail}
    onEmailChange={setNewWorkerEmail}
    newWorkerPassword={newWorkerPassword}
    onPasswordChange={setNewWorkerPassword}
    onCreateWorker={createWorker}
  />
)}

{activeTab === "active" && (
  <div>
    {awaitingComplaints.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-mist uppercase tracking-wide mb-3">
          Needs Your Confirmation ({awaitingComplaints.length})
        </h3>
        <div className="space-y-4">
          {awaitingComplaints.map((c) => (
            <AwaitingConfirmationCard key={c.id} complaint={c} onConfirm={handleConfirmCompletion} />
          ))}
        </div>
      </div>
    )}

    <QueueTab
      complaints={activeComplaints}
      onResolve={handleResolve}
      onReject={handleReject}
      selectedIds={selectedIds}
      onToggleSelect={toggleSelect}
      showSelection={false}
    />
  </div>
)}{selectedIds.length > 0 && activeTab !== "dispatch" && (
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
{rejectingId && (
  <RejectModal onConfirm={confirmReject} onCancel={() => setRejectingId(null)} />
)}

<ToastContainer toasts={toasts} onDismiss={dismissToast} />

<CopilotWidget
  question={copilotQuestion}
  onQuestionChange={setCopilotQuestion}
  answer={copilotAnswer}
  loading={copilotLoading}
  onAsk={askCopilot}
/>
    
    </div>
  );
}