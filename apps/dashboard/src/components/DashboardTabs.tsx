"use client";

import { useRef, useState, useEffect } from "react";
import { ListChecks, Map, Truck, Activity, Users } from "lucide-react";

type Tab = "queue" | "active" | "map" | "dispatch" | "workers";

export default function DashboardTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "queue", label: "Queue", icon: ListChecks },
    { key: "active", label: "Active", icon: Activity },
    { key: "map", label: "Map", icon: Map },
    { key: "dispatch", label: "Dispatch", icon: Truck },
    { key: "workers", label: "Workers", icon: Users },

  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeEl = containerRef.current?.querySelector(`[data-key="${active}"]`) as HTMLElement;
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [active]);

  return (
    <div ref={containerRef} className="relative flex gap-2 border-b border-border mb-8">
      <div
        className="absolute -bottom-[1px] h-[3px] bg-mint rounded-full transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.key}
          data-key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors duration-300 rounded-t-lg ${
            active === tab.key
              ? "text-paper bg-slate shadow-lg shadow-black/20"
              : "text-mist hover:text-paper"
          }`}
        >
          <tab.icon size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}