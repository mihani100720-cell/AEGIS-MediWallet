"use client";

import React, { useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Shield,
  Stethoscope,
  ShieldCheck,
  QrCode,
  FileText,
  Clock,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  Building2,
  User,
  Activity,
  AlertTriangle,
  BadgeCheck,
  LogIn,
  RefreshCw,
  Lock,
  Eye,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function DoctorPortal() {
  const [doctorQrToken, setDoctorQrToken] = useState<string>("");
  const [doctorQrDataUrl, setDoctorQrDataUrl] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<"qr" | "records" | "history">("qr");

  const sharedRecords = [
    {
      type: "Lab Report",
      title: "Complete Blood Count (CBC) & Metabolic Panel",
      date: "Aug 14, 2026",
      hospital: "Vijaya Diagnostics",
      data: "Fasting Glucose: 142 mg/dL (Elevated), HbA1c: 7.1% (High), Hemoglobin: 14.2 g/dL, Platelets: 240,000 /mcL",
      flag: true,
    },
    {
      type: "Lab Report",
      title: "Comprehensive Lipid Profile",
      date: "Jul 2, 2026",
      hospital: "Apollo Health City",
      data: "Total Cholesterol: 198 mg/dL, HDL: 46 mg/dL, LDL: 118 mg/dL (Borderline), Triglycerides: 165 mg/dL",
      flag: false,
    },
    {
      type: "Prescription",
      title: "Cardiology OPD — Aarav Sharma",
      date: "Jun 20, 2026",
      hospital: "Apollo Health City",
      data: "Telmisartan 40mg OD | Metformin 500mg BD | Atorvastatin 10mg HS",
      flag: false,
    },
  ];

  async function handleGenerateQr() {
    setIsGenerating(true);
    try {
      const res = await fetchApi("/consent/qr/request", { method: "POST" });
      setDoctorQrToken(res.qr_token);
      const url = await QRCode.toDataURL(
        `https://mediwallet.health/grant?token=${res.qr_token}`,
        { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } }
      );
      setDoctorQrDataUrl(url);
      setHasGenerated(true);
    } catch (e) {
      const mock = "mw_req_" + Math.random().toString(36).substring(2, 9);
      setDoctorQrToken(mock);
      const url = await QRCode.toDataURL(
        `https://mediwallet.health/grant?token=${mock}`,
        { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } }
      );
      setDoctorQrDataUrl(url);
      setHasGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* Top Utility Bar */}
      <div className="bg-cyan-700 text-white px-4 py-1.5 text-xs text-center">
        <span className="font-semibold">MEDIWALLET Clinician Portal</span>
        <span className="mx-3 opacity-50">•</span>
        <span>Patient data is shared only with explicit time-bound patient consent</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900">Clinician Room</span>
                <span className="text-[11px] text-slate-500 block -mt-0.5">MEDIWALLET Doctor Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold hidden sm:inline">NMC License: MCI-2018-884920 ✓</span>
              <span className="font-semibold sm:hidden">NMC Verified</span>
            </div>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* Doctor Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-xl shadow-sm">
              PN
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">Dr. Priya Nair, MD</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  MCI Verified Clinician
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Chief Cardiologist • Apollo Health City, Jubilee Hills, Hyderabad
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">Cardiology</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">Internal Medicine</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">21+ Years Experience</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleGenerateQr}
              disabled={isGenerating}
              className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
              <span>{hasGenerated ? "Regenerate QR Code" : "Generate Patient Access QR"}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Patient scans to share selected records
            </p>
          </div>
        </div>

        {/* How It Works Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", icon: QrCode, color: "cyan", title: "Generate QR", desc: "Doctor generates a one-time QR code request" },
            { step: "2", icon: Eye, color: "blue", title: "Patient Approves", desc: "Patient scans & selects which records to share" },
            { step: "3", icon: Lock, color: "emerald", title: "Time-Locked Access", desc: "OPD (1h) or Admission mode — auto-expires" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3 shadow-xs">
                <div className={`w-9 h-9 rounded-xl bg-${s.color}-50 border border-${s.color}-200 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 text-${s.color}-600`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{s.step}. {s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* QR Generated Section */}
        {hasGenerated && (
          <div className="bg-white rounded-2xl border border-cyan-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                  <img src={doctorQrDataUrl} alt="Doctor QR Code" className="w-52 h-52" />
                </div>
                <span className="font-mono text-xs text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                  Token: {doctorQrToken}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Expires in 10 minutes</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Show this QR to your patient</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    The patient scans this using their MEDIWALLET app and selects which records to share in OPD or Admission mode.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    "You will only see records the patient explicitly selects",
                    "Access auto-expires when the session ends",
                    "Patient can revoke access instantly at any time",
                    "Full audit trail is maintained for both parties",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Nav */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
          {(["qr", "records", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedTab === tab
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab === "qr" ? "QR Consent" : tab === "records" ? "Shared Records" : "Access History"}
            </button>
          ))}
        </div>

        {/* Tab: QR Consent */}
        {selectedTab === "qr" && !hasGenerated && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Active QR Session</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Generate a QR code above and show it to your patient. Once they scan and approve, their selected records will appear here.
            </p>
            <button
              onClick={handleGenerateQr}
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-all shadow-sm"
            >
              Generate QR Code Now
            </button>
          </div>
        )}

        {/* Tab: Shared Records */}
        {selectedTab === "records" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>3 records authorized</strong> by patient Aarav Sharma in OPD Mode — Access expires in 48 minutes.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedRecords.map((rec) => (
                <div key={rec.title} className="bg-white rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.type === "Lab Report"
                        ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                        : "bg-violet-100 text-violet-800 border border-violet-200"
                    }`}>
                      {rec.type}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rec.date}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {rec.hospital}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl text-xs border ${
                    rec.flag
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    {rec.flag && (
                      <div className="flex items-center gap-1.5 mb-1.5 font-semibold text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Values outside reference range</span>
                      </div>
                    )}
                    {rec.data}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Access History */}
        {selectedTab === "history" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Patient Consent Sessions</h3>
            <div className="space-y-2">
              {[
                { patient: "Aarav Sharma", mode: "OPD", date: "Oct 9, 2026 2:30 PM", status: "Completed", records: 3 },
                { patient: "Sunita Sharma", mode: "OPD", date: "Sep 22, 2026 11:15 AM", status: "Completed", records: 2 },
                { patient: "Ramesh Verma", mode: "Admission", date: "Sep 15, 2026 9:00 AM", status: "Revoked", records: 5 },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-[10px]">
                      {h.patient.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{h.patient}</p>
                      <p className="text-slate-500">{h.date} • {h.records} records • {h.mode}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    h.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-[11px] text-slate-500">
        © 2026 MEDIWALLET. Clinician access is fully audited and patient-controlled.
        <span className="mx-2">•</span>
        <Link href="/" className="hover:underline text-emerald-700">Back to Home</Link>
        <span className="mx-2">•</span>
        <Link href="/dashboard" className="hover:underline">Patient Dashboard</Link>
      </footer>
    </div>
  );
}
