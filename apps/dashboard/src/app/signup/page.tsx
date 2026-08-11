"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function StaffSignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState("field_officer");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/staff/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          invite_code: inviteCode,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Signup failed");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <form onSubmit={handleSignup} className="bg-slate p-8 rounded-xl w-full max-w-sm border border-border">
        <h1 className="text-2xl font-display tracking-wide text-paper mb-1">SwachhLens</h1>
        <p className="text-mint text-sm mb-6">Staff Registration</p>

        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-ink text-paper rounded-lg p-3 mb-3 border border-border focus:border-mint outline-none"
        />
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
        <input
          type="text"
          placeholder="Staff invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="w-full bg-ink text-paper rounded-lg p-3 mb-3 border border-border focus:border-mint outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full bg-ink text-paper rounded-lg p-3 mb-3 border border-border focus:border-mint outline-none"
        >
          <option value="field_officer">Field Worker</option>
          <option value="ward_supervisor">Office Staff (Ward Supervisor)</option>
        </select>

        {error && <p className="text-signal text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mint text-ink rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-mist text-sm text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-mint">Log in</a>
        </p>
      </form>
    </div>
  );
}