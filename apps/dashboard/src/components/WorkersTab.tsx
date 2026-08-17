"use client";

type Worker = {
  id: string;
  full_name: string;
  has_location: boolean;
  last_seen: string | null;
  is_active: boolean;
};

export default function WorkersTab({
  workers,
  showAddWorker,
  onToggleAddWorker,
  newWorkerName,
  onNameChange,
  newWorkerEmail,
  onEmailChange,
  newWorkerPassword,
  onPasswordChange,
  onCreateWorker,
}: {
  workers: Worker[];
  showAddWorker: boolean;
  onToggleAddWorker: (val: boolean) => void;
  newWorkerName: string;
  onNameChange: (val: string) => void;
  newWorkerEmail: string;
  onEmailChange: (val: string) => void;
  newWorkerPassword: string;
  onPasswordChange: (val: string) => void;
  onCreateWorker: () => void;
}) {
return (
  <div>
    <div className="mb-5">
      {!showAddWorker ? (
        <button
          onClick={() => onToggleAddWorker(true)}
          className="text-mint text-sm hover:opacity-80"
        >
          + Add a new field worker
        </button>
      ) : (
        <div className="bg-slate border border-border rounded-lg p-4 space-y-2 max-w-sm">
          <input
            type="text"
            placeholder="Full name"
            value={newWorkerName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full bg-ink text-paper rounded-lg p-2.5 border border-border focus:border-mint outline-none text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={newWorkerEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full bg-ink text-paper rounded-lg p-2.5 border border-border focus:border-mint outline-none text-sm"
          />
          <input
            type="password"
            placeholder="Temporary password"
            value={newWorkerPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full bg-ink text-paper rounded-lg p-2.5 border border-border focus:border-mint outline-none text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={onCreateWorker}
              className="flex-1 bg-mint text-ink rounded-lg py-2 text-sm font-medium hover:opacity-90"
            >
              Create
            </button>
            <button
              onClick={() => onToggleAddWorker(false)}
              className="flex-1 text-mist border border-border rounded-lg py-2 text-sm hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>

    {workers.length === 0 ? (
      <p className="text-mist">No field workers yet.</p>
    ) : (
      <div className="space-y-3">
        {workers.map((w) => (
<div
  key={w.id}
  className={`bg-slate rounded-xl p-5 border-l-4 flex items-center justify-between transition-colors ${
    w.is_active ? "border-mint" : "border-border"
  }`}
>
  <div className="flex items-center gap-4">
    <div
      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${
        w.is_active ? "bg-mint text-ink" : "bg-ink text-mist"
      }`}
    >
      {w.full_name.charAt(0).toUpperCase()}
    </div>
    <div>
      <p className="text-paper font-medium">{w.full_name}</p>
      <p className="text-xs text-mist mt-1">
        {w.has_location && w.last_seen
          ? `Last seen ${new Date(w.last_seen).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
          : "No location data yet"}
      </p>
    </div>
  </div>

  <span
    className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
      w.is_active ? "bg-mint/15 text-mint" : "bg-mist/15 text-mist"
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${w.is_active ? "bg-mint" : "bg-mist"}`} />
    {w.is_active ? "On Field" : "Inactive"}
  </span>
</div>
  ))}
      </div>
    )}
  </div>
);
}