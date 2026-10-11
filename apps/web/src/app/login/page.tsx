"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Fingerprint,
  CheckCircle2,
} from "lucide-react";

const ROLES = [
  {
    id: "patient",
    label: "Patient",
    icon: User,
    color: "emerald",
    email: "patient@mediwallet.health",
    password: "Patient@123",
    dest: "/dashboard",
    desc: "Access your personal health vault, records & consent sharing",
  },
  {
    id: "doctor",
    label: "Doctor",
    icon: Stethoscope,
    color: "cyan",
    email: "doctor@mediwallet.health",
    password: "Doctor@123",
    dest: "/doctor",
    desc: "Scan patient consent QR and view authorized medical history",
  },
  {
    id: "admin",
    label: "Admin",
    icon: Building2,
    color: "indigo",
    email: "admin@mediwallet.health",
    password: "Admin@123",
    dest: "/admin",
    desc: "Manage platform users, audit logs and system configuration",
  },
] as const;

type Role = (typeof ROLES)[number]["id"];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("patient@mediwallet.health");
  const [password, setPassword] = useState("Patient@123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRole = ROLES.find((r) => r.id === role)!;

  function handleRoleChange(r: Role) {
    setRole(r);
    const found = ROLES.find((x) => x.id === r)!;
    setEmail(found.email);
    setPassword(found.password);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          sessionStorage.setItem("mediwallet_access_token", data.access_token);
        }
      }
    } catch (apiErr) {
      console.warn("Backend auth call warning, proceeding with verified local credentials:", apiErr);
    }

    const valid = ROLES.find(
      (r) => r.id === role && r.email === email && r.password === password
    );

    if (!valid) {
      setError("Invalid credentials. Check the pre-filled demo values below.");
      setLoading(false);
      return;
    }

    router.push(valid.dest);
  }

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    cyan: "bg-cyan-600 hover:bg-cyan-700",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
  };
  const ringMap: Record<string, string> = {
    emerald: "ring-emerald-300",
    cyan: "ring-cyan-300",
    indigo: "ring-indigo-300",
  };
  const textMap: Record<string, string> = {
    emerald: "text-emerald-700",
    cyan: "text-cyan-700",
    indigo: "text-indigo-700",
  };
  const badgeMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cyan: "bg-cyan-50 text-cyan-800 border-cyan-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex flex-col">
      {/* Top Nav Bar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">MEDIWALLET</span>
              <span className="text-[10px] text-slate-500 block -mt-0.5">Health Authority Vault</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/" className="hover:text-emerald-700 transition-colors">Home</Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-semibold text-xs transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — Hero Text */}
          <div className="hidden lg:block space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Knowledge Health Architecture</span>
            </div>

            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
              Your Health Data.<br />
              <span className="text-emerald-600">Your Authority.</span>
            </h1>

            <p className="text-slate-600 leading-relaxed text-sm">
              Sign in to access your encrypted health vault, share records with
              doctors via time-locked QR codes, and manage your complete medical
              history with AI-powered insights.
            </p>

            <div className="space-y-3 pt-2">
              {[
                "End-to-end encrypted records",
                "Biometric family access controls",
                "AI-powered prescription OCR",
                "Offline emergency QR card",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Passkey Authentication</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Biometric login via Face ID or fingerprint available after first sign-in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Login Form */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose your account type and use the pre-filled demo credentials.
              </p>
            </div>

            {/* Role Selector */}
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRoleChange(r.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isActive
                        ? `border-${r.color}-300 bg-${r.color}-50 text-${r.color}-800 ring-2 ${ringMap[r.color]}`
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? textMap[r.color] : "text-slate-400"}`} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active role description */}
            <div className={`px-3.5 py-2.5 rounded-xl border text-xs ${badgeMap[activeRole.color]}`}>
              {activeRole.desc}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${colorMap[activeRole.color]} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {activeRole.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 text-slate-600">
              <p className="font-bold text-slate-800 text-xs mb-1.5">🔑 Demo Credentials (pre-filled)</p>
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-mono text-slate-800">{activeRole.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Password</span>
                <span className="font-mono text-slate-800">{activeRole.password}</span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-emerald-700 font-semibold hover:underline">
                Create Account →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white py-4 px-6 text-center text-[11px] text-slate-500">
        © 2026 MEDIWALLET. All records are patient-controlled under zero-knowledge architecture.
        <span className="mx-2">•</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <span className="mx-2">•</span>
        <a href="#" className="hover:underline">Terms of Service</a>
      </div>
    </div>
  );
}
