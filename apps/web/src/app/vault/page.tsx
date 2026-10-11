"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  FileText,
  Activity,
  QrCode,
  HeartPulse,
  Users,
  Sparkles,
  Pill,
  Calendar,
  Apple,
  Home,
  ChevronDown,
  Stethoscope,
  Building,
  User,
  LogOut
} from "lucide-react";
import MedicalVaultView from "../components/MedicalVaultView";
import { translations, Language } from "@/lib/i18n";
import { fetchApi } from "@/lib/api";

export default function VaultPage() {
  const [lang, setLang] = useState<Language>("en");
  const [recordsCount, setRecordsCount] = useState<number>(0);

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#26352B] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DDE7DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#168653] text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-[#26352B]">
                  MEDI<span className="text-[#168653]">WALLET</span>
                </span>
                <span className="text-[10px] font-semibold text-[#647067] tracking-wider uppercase -mt-1">
                  Medical Vault
                </span>
              </div>
            </Link>

            <span className="hidden md:inline px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6EE] text-[#126640] border border-[#DDE7DF]">
              Patient Control Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F8F5] border border-[#DDE7DF] text-xs font-bold text-[#26352B] transition-all flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-[#168653]" />
              <span className="hidden sm:inline">Main Dashboard</span>
            </Link>

            <Link
              href="/doctor"
              className="px-3.5 py-1.5 rounded-xl bg-[#EAF6EE] hover:bg-[#d8eedf] border border-[#DDE7DF] text-xs font-bold text-[#126640] transition-all flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#168653]" />
              <span className="hidden sm:inline">Doctor Portal</span>
            </Link>

            <div className="flex items-center gap-2 bg-[#F5F8F5] px-2.5 py-1 rounded-xl border border-[#DDE7DF]">
              <div className="w-6 h-6 rounded-full bg-[#168653] text-white text-xs font-bold flex items-center justify-center">
                AS
              </div>
              <span className="text-xs font-bold text-[#26352B] hidden md:inline">Aarav Sharma</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Vault Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MedicalVaultView onRecordCountChange={(c) => setRecordsCount(c)} />
      </main>
    </div>
  );
}
