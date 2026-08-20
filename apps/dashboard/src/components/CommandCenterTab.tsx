"use client";

import { useMemo } from "react";

type Complaint = {
  id: string;
  status: string;
  category: string | null;
  severity_score: number | null;
  reported_at: string;
  latitude: number;
  longitude: number;
  estimated_cleanup_minutes?: number | null;
  workers_needed?: number | null;
  report_count?: number | null;
};

type Worker = {
  id: string;
  full_name: string;
  has_location: boolean;
  last_seen: string | null;
  is_active: boolean;
};

type WorkerPosition = {
  worker_id: string;
  latitude: number;
  longitude: number;
};

type Zone = {
  id: string;
  complaints: Complaint[];
  centerLat: number;
  centerLon: number;
  risk: number;
  cleanupMinutes: number;
  workersNeeded: number;
  highSeverityCount: number;
  totalReports: number;
  dominantCategory: string;
};

const ZONE_RADIUS_KM = 1.2;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categoryRisk(category: string | null) {
  switch (category) {
    case "drain_blockage":
      return 12;
    case "hazardous":
      return 12;
    case "illegal_dump":
      return 10;
    case "construction_debris":
      return 8;
    case "overflowing_bin":
      return 7;
    default:
      return 4;
  }
}

function calculateZoneRisk(complaints: Complaint[]) {
  if (complaints.length === 0) return 0;

  const avgSeverity =
    complaints.reduce((sum, c) => sum + (c.severity_score ?? 0), 0) /
    complaints.length;

  const totalReports = complaints.reduce(
    (sum, c) => sum + (c.report_count ?? 1),
    0
  );

  const categoryBoost = Math.min(
    complaints.reduce((sum, c) => sum + categoryRisk(c.category), 0),
    30
  );

  const now = Date.now();

  const ageHours =
    complaints.reduce((sum, c) => {
      const age = Math.max(
        0,
        (now - new Date(c.reported_at).getTime()) / 3600000
      );

      return sum + Math.min(age, 24);
    }, 0) / complaints.length;

  const densityScore = Math.min(complaints.length * 6, 30);
  const reportScore = Math.min(totalReports * 2, 20);
  const ageScore = Math.min(ageHours * 0.8, 20);

  return Math.min(
    100,
    Math.round(
      avgSeverity * 0.55 +
        densityScore * 0.15 +
        reportScore * 0.1 +
        ageScore * 0.1 +
        categoryBoost * 0.1
    )
  );
}

function buildZones(complaints: Complaint[]): Zone[] {
  const remaining = [...complaints];
  const zones: Zone[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift()!;

    const grouped = remaining.filter(
      (candidate) =>
        haversineKm(
          seed.latitude,
          seed.longitude,
          candidate.latitude,
          candidate.longitude
        ) <= ZONE_RADIUS_KM
    );

    const groupedIds = new Set(grouped.map((c) => c.id));

    for (let i = remaining.length - 1; i >= 0; i--) {
      if (groupedIds.has(remaining[i].id)) {
        remaining.splice(i, 1);
      }
    }

    const zoneComplaints = [seed, ...grouped];

    const centerLat =
      zoneComplaints.reduce((sum, c) => sum + c.latitude, 0) /
      zoneComplaints.length;

    const centerLon =
      zoneComplaints.reduce((sum, c) => sum + c.longitude, 0) /
      zoneComplaints.length;

    const categoryCounts: Record<string, number> = {};

    for (const complaint of zoneComplaints) {
      const category = complaint.category || "unknown";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    const dominantCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "mixed waste";

    zones.push({
      id: `zone-${zones.length + 1}`,
      complaints: zoneComplaints,
      centerLat,
      centerLon,
      risk: calculateZoneRisk(zoneComplaints),
      cleanupMinutes: zoneComplaints.reduce(
        (sum, c) => sum + (c.estimated_cleanup_minutes ?? 0),
        0
      ),
      workersNeeded: zoneComplaints.reduce(
        (sum, c) => sum + (c.workers_needed ?? 1),
        0
      ),
      highSeverityCount: zoneComplaints.filter(
        (c) => (c.severity_score ?? 0) >= 75
      ).length,
      totalReports: zoneComplaints.reduce(
        (sum, c) => sum + (c.report_count ?? 1),
        0
      ),
      dominantCategory,
    });
  }

  return zones.sort((a, b) => b.risk - a.risk);
}

export default function CommandCenterTab({
  complaints,
  workers,
  workerPositions,
}: {
  complaints: Complaint[];
  workers: Worker[];
  workerPositions: WorkerPosition[];
}) {
  const activeComplaints = complaints.filter(
    (c) =>
      c.status !== "resolved" &&
      c.status !== "rejected"
  );

  const zones = useMemo(
    () => buildZones(activeComplaints),
    [activeComplaints]
  );

  const topZone = zones[0] ?? null;

  const positionedWorkers = workers
    .filter((worker) => worker.is_active && worker.has_location)
    .map((worker) => {
      const position = workerPositions.find(
        (p) => p.worker_id === worker.id
      );

      if (!position) return null;

      return {
        ...worker,
        latitude: position.latitude,
        longitude: position.longitude,
      };
    })
    .filter(Boolean) as Array<
    Worker & {
      latitude: number;
      longitude: number;
    }
  >;

  const recommendedWorkers = topZone
    ? [...positionedWorkers]
        .map((worker) => ({
          worker,
          distance: haversineKm(
            topZone.centerLat,
            topZone.centerLon,
            worker.latitude,
            worker.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(
          0,
          Math.max(1, Math.min(topZone.workersNeeded || 1, positionedWorkers.length))
        )
    : [];

  const totalActive = activeComplaints.length;

  const highRiskCount = activeComplaints.filter(
    (c) => (c.severity_score ?? 0) >= 75
  ).length;

  const totalCleanupMinutes = activeComplaints.reduce(
    (sum, c) => sum + (c.estimated_cleanup_minutes ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2">
          Municipal Operations Intelligence
        </p>
        <h2 className="text-2xl font-display text-paper">
          Command Center
        </h2>
        <p className="text-sm text-mist mt-1">
          Understand where risk is concentrating and where field resources
          should move next.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate rounded-xl border border-border p-5">
          <p className="text-xs uppercase tracking-wide text-mist">
            Active complaints
          </p>
          <p className="text-3xl font-display text-paper mt-2">
            {totalActive}
          </p>
        </div>

        <div className="bg-slate rounded-xl border border-border p-5">
          <p className="text-xs uppercase tracking-wide text-mist">
            High-risk complaints
          </p>
          <p className="text-3xl font-display text-signal mt-2">
            {highRiskCount}
          </p>
        </div>

        <div className="bg-slate rounded-xl border border-border p-5">
          <p className="text-xs uppercase tracking-wide text-mist">
            Estimated cleanup demand
          </p>
          <p className="text-3xl font-display text-mint mt-2">
            {Math.round(totalCleanupMinutes)} min
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-mist">
                Live city risk
              </p>
              <h3 className="text-lg font-semibold text-paper mt-1">
                Emerging zones
              </h3>
            </div>

            <span className="text-xs text-mist">
              {zones.length} zones
            </span>
          </div>

          {zones.length === 0 ? (
            <p className="text-sm text-mist">
              No active complaints to analyze.
            </p>
          ) : (
            <div className="space-y-3">
              {zones.slice(0, 5).map((zone, index) => (
                <div
                  key={zone.id}
                  className="rounded-xl bg-ink border border-border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-paper font-medium">
                        {index === 0 ? "🔴" : index === 1 ? "🟠" : "🟡"}{" "}
                        Zone {String.fromCharCode(65 + index)}
                      </p>

                      <p className="text-xs text-mist mt-1 capitalize">
                        {zone.dominantCategory.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-2xl font-display ${
                          zone.risk >= 75
                            ? "text-signal"
                            : zone.risk >= 50
                            ? "text-[#F4A73B]"
                            : "text-mint"
                        }`}
                      >
                        {zone.risk}
                      </p>
                      <p className="text-[10px] uppercase text-mist">
                        risk
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                    <div>
                      <p className="text-mist">Complaints</p>
                      <p className="text-paper font-semibold mt-1">
                        {zone.complaints.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-mist">Cleanup</p>
                      <p className="text-paper font-semibold mt-1">
                        {Math.round(zone.cleanupMinutes)} min
                      </p>
                    </div>

                    <div>
                      <p className="text-mist">High severity</p>
                      <p className="text-paper font-semibold mt-1">
                        {zone.highSeverityCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate rounded-xl border border-border p-6">
          <p className="text-xs uppercase tracking-wide text-mist">
            Resource position
          </p>

          <h3 className="text-lg font-semibold text-paper mt-1 mb-5">
            Field workers near current risk
          </h3>

          {!topZone ? (
            <p className="text-sm text-mist">
              No risk zone available yet.
            </p>
          ) : positionedWorkers.length === 0 ? (
            <p className="text-sm text-mist">
              No active workers with a live location.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendedWorkers.map(({ worker, distance }) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between bg-ink border border-border rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-paper font-medium">
                      {worker.full_name}
                    </p>
                    <p className="text-xs text-mint mt-1">
                      Live location available
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-paper font-semibold">
                      {distance.toFixed(1)} km
                    </p>
                    <p className="text-xs text-mist">
                      from Zone A
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {topZone && (
        <div className="bg-slate rounded-xl border border-mint/30 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-mint">
                Recommended deployment
              </p>

              <h3 className="text-xl font-semibold text-paper mt-1">
                Prioritize Zone A
              </h3>
            </div>

            <div className="text-right">
              <p className="text-3xl font-display text-mint">
                {topZone.risk}
              </p>
              <p className="text-[10px] uppercase text-mist">
                zone risk
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-mist mb-3">
                Recommended field deployment
              </p>

              {recommendedWorkers.length === 0 ? (
                <div className="rounded-lg bg-ink border border-border p-4 text-sm text-mist">
                  No workers with current location are available for a
                  distance-based recommendation.
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendedWorkers.map(({ worker, distance }) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between rounded-lg bg-ink border border-border px-4 py-3"
                    >
                      <span className="text-paper">
                        {worker.full_name}
                      </span>
                      <span className="text-mint text-sm">
                        {distance.toFixed(1)} km away
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-mist mb-3">
                Why Zone A?
              </p>

              <div className="space-y-2 text-sm text-paper">
                <p>• {topZone.complaints.length} active complaints</p>
                <p>• Risk score {topZone.risk}/100</p>
                <p>
                  • {Math.round(topZone.cleanupMinutes)} minutes estimated
                  cleanup demand
                </p>
                <p>• {topZone.highSeverityCount} critical complaints</p>
                <p>• {topZone.totalReports} total citizen reports</p>
                <p>
                  • Dominant issue:{" "}
                  {topZone.dominantCategory.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}