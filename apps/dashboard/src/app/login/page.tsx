"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-slate p-8 rounded-xl w-full max-w-sm border border-border">
        <h1 className="text-2xl font-display tracking-wide text-paper mb-1">SwachhLens</h1>
        <p className="text-mint text-sm mb-6">Municipal Staff Login</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-ink text-paper rounded-lg p-3 mb-3 border border-border focus:border-mint outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-ink text-paper rounded-lg p-3 mb-3 border border-border focus:border-mint outline-none"
        />

        {error && <p className="text-signal text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mint text-ink rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-mist text-sm text-center mt-4">
          New staff member?{" "}
          <a href="/signup" className="text-mint">Register here</a>
        </p>
      </form>
    </div>
  );
}