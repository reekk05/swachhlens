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
    <div className="min-h-screen bg-[#0d1b0f] flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-[#132618] p-8 rounded-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">SwachhLens</h1>
        <p className="text-[#6fcf97] text-sm mb-6">Municipal Staff Login</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#0d1b0f] text-white rounded-lg p-3 mb-3 border border-[#2e7d4f]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0d1b0f] text-white rounded-lg p-3 mb-3 border border-[#2e7d4f]"
        />

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2e7d4f] text-white rounded-lg py-3 font-semibold"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}