"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Building,
  User,
  Activity,
  Lock
} from "lucide-react";

export default function AdminPortal() {
  const [doctors, setDoctors] = useState([
    {
      id: 1,
      name: "Dr. Sandeep Reddy, MS",
      specialization: "Ophthalmology & Retinal Surgery",
      hospital: "Care Hospital, Banjara Hills",
      regNo: "TS-MC-2021-49210",
      status: "pending"
    },
    {
      id: 2,
      name: "Dr. Rajesh Varma, MD",
      specialization: "Pulmonology & Critical Care",
      hospital: "Yashoda Hospitals, Secunderabad",
      regNo: "AP-MC-2017-38194",
      status: "pending"
    }
  ]);

  function handleVerify(id: number, approved: boolean) {
    setDoctors(doctors.map((d) => (d.id === id ? { ...d, status: approved ? "verified" : "rejected" } : d)));
    alert(approved ? "Doctor license approved! Verified badge issued." : "Registration rejected.");
  }

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans">
      <header className="bg-[#090f20] border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">National Health Authority • Governance Console</span>
            </div>
          </div>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-bold border border-indigo-500/20">
            NHA Level 3 Security
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinician Verification & License Review Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Validate professional medical practitioner credentials against National Medical Commission (NMC) databases.
          </p>
        </div>

        <div className="space-y-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{doc.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.status === "verified"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : doc.status === "rejected"
                        ? "bg-rose-500/10 text-rose-400"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {doc.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{doc.specialization} • {doc.hospital}</p>
                <p className="text-xs text-slate-400 font-mono">License: <strong>{doc.regNo}</strong></p>
              </div>

              {doc.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify(doc.id, true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Approve & Issue Badge
                  </button>
                  <button
                    onClick={() => handleVerify(doc.id, false)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
