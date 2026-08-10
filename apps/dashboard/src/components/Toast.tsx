"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export type ToastData = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
};

export function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 6000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const icon =
    toast.type === "success" ? (
      <CheckCircle2 size={18} className="text-mint shrink-0" />
    ) : toast.type === "error" ? (
      <XCircle size={18} className="text-signal shrink-0" />
    ) : null;

  return (
    <div className="bg-slate border border-border rounded-xl p-4 shadow-2xl shadow-black/40 flex items-start gap-3 w-80 animate-in slide-in-from-right">
      {icon}
      <div className="flex-1">
        <p className="text-sm font-medium text-paper">{toast.title}</p>
        {toast.message && <p className="text-xs text-mist mt-1">{toast.message}</p>}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-mist hover:text-paper">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}