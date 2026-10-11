"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  QrCode,
  FileText,
  Activity,
  HeartPulse,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Lock,
  ArrowRight,
  Stethoscope,
  LogIn,
  UserPlus,
  Pill,
  Calendar,
  Camera,
  Star,
  Zap,
  Check,
  Plus,
  Crown,
  Share2,
  Clock,
  RefreshCw,
  Bell,
  Smartphone,
  CreditCard,
  User,
  AlertCircle,
  Eye,
  Sliders,
  ChevronRight,
} from "lucide-react";

/** Silky scroll-reveal wrapper that triggers gentle floating fade-in as user scrolls */
function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "ocr" | "emergency">("timeline");
  const [consentHours, setConsentHours] = useState<number>(24);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const runOcrDemo = () => {
    setOcrScanning(true);
    setOcrComplete(false);
    setTimeout(() => {
      setOcrScanning(false);
      setOcrComplete(true);
    }, 2200);
  };

  const testimonials = [
    {
      quote:
        "“In outpatient consultations, patients often arrive with crumpled hospital bags or fragmented WhatsApp PDFs. Having a single verified, chronological timeline with temporary QR consent saves 10 crucial minutes and completely prevents drug-drug interactions.”",
      name: "Prof. Dr. Ali Irani",
      role: "Head of Dept, Physiotherapy & Sports Medicine, Nanavati Hospital, Mumbai",
      hospital: "Nanavati Max Super Speciality",
      avatar: "AI",
    },
    {
      quote:
        "“For child immunization and paediatric development, keeping track of every growth milestone and antibiotic prescription across years in one place is transformative for parents and pediatricians alike.”",
      name: "Dr. Ketan Gadre",
      role: "Consultant Paediatrician, MD Paediatrics",
      hospital: "Gadre Children's Clinic",
      avatar: "KG",
    },
    {
      quote:
        "“Before any planned surgery, knowing the exact cardiac history, allergy profile, and previous discharge summaries without relying on paper files is life-saving in pre-op assessment.”",
      name: "Dr. Saleh Parkar",
      role: "Senior Consultant Laparoscopic & General Surgeon, MS Surgery",
      hospital: "Apollo Hospitals",
      avatar: "SP",
    },
  ];

  const faqs = [
    {
      q: "Is my medical data shared with doctors or hospitals without my permission?",
      a: "Never. Mediwallet operates on a strict zero-unilateral-access architecture. Doctors can only view records that you explicitly select via time-bound QR consent (OPD or Inpatient). You retain the authority to revoke access immediately at any moment.",
    },
    {
      q: "How does the Offline Emergency QR work without internet?",
      a: "Your emergency vitals—blood group, severe allergies, chronic conditions, and emergency contact numbers—are compactly encoded directly within the QR graphic itself. First responders can scan it in airplane mode without pinging any server.",
    },
    {
      q: "How does the handwritten prescription recognition (RxScript) work?",
      a: "Our backend utilizes the Hugging Face TrOCR neural network pipeline. It cleans cursive handwriting, segments lines, recognizes candidate medications, checks against the Indian Pharmacopoeia, and displays confidence percentages in ~2.5 seconds.",
    },
    {
      q: "Can I use WhatsApp to upload medical reports and receive reminders?",
      a: "Yes! With our Pro and Pro Plus tiers, you can forward PDF lab reports, discharge slips, and prescription images directly to our verified WhatsApp bot, which automatically indexes them into your vault and sends meal-time medication alerts.",
    },
    {
      q: "What is OPD vs Admission sharing mode?",
      a: "OPD Mode shares strictly 1-2 selected documents for a standard consultation and auto-expires in 4 to 28 hours. Admission Mode allows authorized access to select inpatient history during a hospital stay, while ensuring non-selected personal records remain locked.",
    },
    {
      q: "Can family members see each other's medical records?",
      a: "No. Each family member's health records are strictly partitioned into protected sub-vaults with facial recognition biometrics and Argon2id password protection.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden relative">

      {/* ===================== SILKY AMBIENT GLOW ORBS ===================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-200/35 via-teal-100/25 to-transparent blur-[120px] animate-orb" />
        <div className="absolute top-1/3 -right-48 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-cyan-200/30 via-blue-100/20 to-transparent blur-[140px] animate-orb" style={{ animationDelay: "-5s" }} />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-100/30 via-teal-100/20 to-transparent blur-[130px] animate-orb" style={{ animationDelay: "-9s" }} />
      </div>

      {/* ===================== FLOATING PILL NAVBAR ===================== */}
      <div className="sticky top-0 z-50 px-4 pt-3 pb-2 transition-all duration-300">
        <header
          className={`max-w-6xl mx-auto rounded-full transition-all duration-300 px-5 py-3 flex items-center justify-between gap-4 ${
            scrolled
              ? "bg-white/85 backdrop-blur-xl shadow-lg shadow-emerald-900/5 border border-emerald-100/80"
              : "bg-white/70 backdrop-blur-md border border-slate-200/70 shadow-sm"
          }`}
        >
          {/* Brand Logo with Lively Emerald & Teal Gradient */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                  MEDIWALLET
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                Patient-Owned Health Shield
              </span>
            </div>
          </Link>

          {/* Centered Navigation Pill */}
          <nav className="hidden md:flex items-center gap-6 px-6 py-2 rounded-full bg-slate-50/80 border border-slate-200/60 text-xs font-semibold text-slate-600 shadow-xs">
            <a href="#features" className="hover:text-emerald-700 transition-colors">Features</a>
            <a href="#interactive-vault" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
              <span>Interactive Vault</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </a>
            <a href="#pricing" className="hover:text-emerald-700 transition-colors">Pricing</a>
            <a href="#doctors" className="hover:text-emerald-700 transition-colors">Doctors</a>
            <a href="#faqs" className="hover:text-emerald-700 transition-colors">FAQs</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 rounded-full transition-all hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/vault"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Open Vault</span>
            </Link>
          </div>
        </header>
      </div>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative z-10 pt-6 pb-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Large Hero Banner with Soft Flowy Gradient Canvas */}
          <RevealOnScroll delay={50}>
            <div className="relative rounded-[2.8rem] bg-gradient-to-br from-[#E6F7F0] via-[#F0FDF8] to-[#E9F8F9] border border-emerald-100/90 p-6 sm:p-10 lg:p-14 overflow-hidden shadow-sm">
              {/* Top Micro Live Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-200/70 text-emerald-800 text-xs font-bold shadow-xs mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Patient-Controlled Health Authority • Zero Unilateral Access</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AES-256
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Left Column: Flowy Editorial Headline & Copy */}
                <div className="lg:col-span-7 space-y-6">
                  <h1 className="font-serif-editorial text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-[1.06]">
                    Every heartbeat remembered,{" "}
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 italic">
                      protected for the ones you love.
                      <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 280 10" fill="none">
                        <path d="M4 6 Q140 11 276 5" stroke="#10B981" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
                      </svg>
                    </span>
                  </h1>

                  <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
                    Your true medical memory — a private, chronological timeline of every doctor visit, handwritten prescription, and lab report. Strictly owned by you, not scattered across hospitals or lost in a drawer.
                  </p>

                  {/* Primary Action Buttons with Silky Transitions */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <Link
                      href="/vault"
                      className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Open My Medical Vault</span>
                    </Link>

                    <a
                      href="#pricing"
                      className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-sm transition-all shadow-xs hover:shadow-sm hover:border-emerald-200 flex items-center gap-2"
                    >
                      <span>View Pricing Plans</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </a>
                  </div>

                  {/* Trust mini-pills */}
                  <div className="pt-3 flex flex-wrap items-center gap-5 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      100% Patient Controlled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Hugging Face TrOCR
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Offline Emergency QR
                    </span>
                  </div>
                </div>

                {/* Right Column: Live Interactive Device Frame with Lively Tabs */}
                <div id="interactive-vault" className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[360px] bg-slate-900 rounded-[2.8rem] p-3 shadow-2xl shadow-emerald-950/20 border-4 border-slate-800 ring-1 ring-slate-900/10 flow-card">
                    {/* Phone Screen */}
                    <div className="bg-[#FAFDFB] rounded-[2.2rem] overflow-hidden p-4 space-y-3.5 border border-slate-200 relative">
                      
                      {/* Status bar */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-2 pt-1">
                        <span>09:41</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-emerald-600 font-mono">ENCRYPTED</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>

                      {/* App Header Inside Phone */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Medical Vault</p>
                          <h4 className="text-sm font-extrabold text-slate-900">Aarav Sharma</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          VAULT UNLOCKED
                        </span>
                      </div>

                      {/* Interactive Tab Switcher inside the Phone Mockup */}
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600">
                        <button
                          onClick={() => setActiveTab("timeline")}
                          className={`py-1.5 rounded-lg transition-all ${
                            activeTab === "timeline" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                          }`}
                        >
                          Timeline
                        </button>
                        <button
                          onClick={() => setActiveTab("ocr")}
                          className={`py-1.5 rounded-lg transition-all ${
                            activeTab === "ocr" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                          }`}
                        >
                          Rx Scan
                        </button>
                        <button
                          onClick={() => setActiveTab("emergency")}
                          className={`py-1.5 rounded-lg transition-all ${
                            activeTab === "emergency" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                          }`}
                        >
                          SOS QR
                        </button>
                      </div>

                      {/* TAB 1: TIMELINE */}
                      {activeTab === "timeline" && (
                        <div className="space-y-2.5 animate-fade-in">
                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-xs">
                              <p className="text-xs font-extrabold text-emerald-600">14</p>
                              <p className="text-[9px] text-slate-400">Records</p>
                            </div>
                            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-xs">
                              <p className="text-xs font-extrabold text-teal-600">B+</p>
                              <p className="text-[9px] text-slate-400">Blood Grp</p>
                            </div>
                            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-xs">
                              <p className="text-xs font-extrabold text-cyan-600">4</p>
                              <p className="text-[9px] text-slate-400">Members</p>
                            </div>
                          </div>

                          {/* Recent Visit 1 */}
                          <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-900">Apollo Hospital OPD</span>
                              <span className="text-slate-400">Yesterday</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold">Prescription</span>
                              <span>Dr. Priya Nair (Cardiology)</span>
                            </div>
                            <div className="text-[9px] text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded">
                              ✓ TrOCR: Azithromycin 500mg
                            </div>
                          </div>

                          {/* Recent Visit 2 */}
                          <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-900">Metropolis Diagnostics</span>
                              <span className="text-slate-400">Oct 4</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded font-semibold">Lab Report</span>
                              <span>CBC, Lipid Panel & HbA1c</span>
                            </div>
                            <div className="text-[9px] text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                              All 12 biomarkers normal
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: RX SCAN DEMO */}
                      {activeTab === "ocr" && (
                        <div className="space-y-2.5 animate-fade-in">
                          <div className="relative bg-slate-900 text-white rounded-xl p-3 overflow-hidden">
                            {/* Animated laser line during scanning */}
                            {ocrScanning && (
                              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10B981] animate-laser z-10" />
                            )}
                            <div className="flex items-center justify-between text-[10px] pb-1.5 border-b border-slate-800">
                              <span className="text-emerald-400 font-mono">Neural RxScript OCR</span>
                              <span className="text-slate-400">TrOCR Model</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-mono pt-1 italic">
                              &quot;Tab Azithral 500mg 1 OD x 3d...&quot;
                            </p>
                          </div>

                          <button
                            onClick={runOcrDemo}
                            disabled={ocrScanning}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            {ocrScanning ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Recognizing Handwriting...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>Simulate Scan Laser</span>
                              </>
                            )}
                          </button>

                          <div className="bg-white rounded-xl p-2 border border-emerald-100 text-[10px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>Detected Drugs:</span>
                              <span className="text-emerald-600 text-[9px]">95% Match</span>
                            </div>
                            <p className="text-[9px] text-slate-600 font-mono">• Azithromycin 500 mg (1-0-0)</p>
                            <p className="text-[9px] text-slate-600 font-mono">• Cetirizine 10 mg (0-0-1)</p>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: EMERGENCY QR */}
                      {activeTab === "emergency" && (
                        <div className="space-y-2.5 animate-fade-in text-center">
                          <div className="p-3 bg-white rounded-2xl border border-rose-100 shadow-xs space-y-2">
                            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-xl p-1.5 text-white flex items-center justify-center">
                              <QrCode className="w-16 h-16 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">Emergency Vitals QR</p>
                              <p className="text-[9px] text-rose-600 font-bold">Works Offline Without Internet</p>
                            </div>
                            <div className="flex justify-around text-[9px] font-mono pt-1 text-slate-600 border-t border-slate-100">
                              <span>Blood: <b>B+</b></span>
                              <span>Allergy: <b>Penicillin</b></span>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400">
                            First responders scan directly in airplane mode.
                          </p>
                        </div>
                      )}

                      {/* Temporary Share Card */}
                      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-900">Active Doctor QR</p>
                          <p className="text-[9px] text-emerald-700 font-medium">Expires in {consentHours} hrs</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-white">
                          OPD Mode
                        </span>
                      </div>

                      {/* Bottom Nav Mockup */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-[10px] font-bold text-slate-400">
                        <span className="text-emerald-700">Home</span>
                        <span>Visits</span>
                        <span>Vault</span>
                        <span>Family</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===================== LIVELY STATS STRIP ===================== */}
      <section className="relative z-10 py-8 px-4 bg-white/70 backdrop-blur-md border-y border-emerald-100/80">
        <RevealOnScroll delay={100}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "100%", label: "Patient Controlled", sub: "Zero hospital lock-in" },
              { val: "2.5s", label: "Neural OCR Speed", sub: "TrOCR vision model" },
              { val: "ISO 27001", label: "Certified Security", sub: "Memory-hard Argon2id" },
              { val: "Offline", label: "Emergency Card", sub: "Instant first responder scan" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700">
                  {item.val}
                </p>
                <p className="text-xs font-bold text-slate-800">{item.label}</p>
                <p className="text-[11px] text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </section>

      {/* ========================================================================= */}
      {/* ============ BENTO GRID: FLOWY CARDS MATCHING YOUR SCREENSHOTS =========== */}
      {/* ========================================================================= */}
      <section id="features" className="relative z-10 py-24 px-4 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* Section Heading */}
          <RevealOnScroll delay={50}>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Designed to Flow Seamlessly
              </span>
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-normal text-slate-900">
                Your entire medical story, effortless and alive.
              </h2>
              <p className="text-slate-500 text-sm sm:text-base">
                Everything connects naturally — from your first visit entry to lifelong emergency protection.
              </p>
            </div>
          </RevealOnScroll>

          {/* ROW 1: "Log every visit in seconds" & "All your documents, one tap away" (Matches Screenshot 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

            {/* CARD 1: Log every visit in seconds (Fanned Out Cards) */}
            <RevealOnScroll delay={100} className="h-full">
              <div className="rounded-[2.2rem] bg-[#EAF5FC] border border-[#D5EBF8] p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-lg transition-all duration-500 group">
                
                {/* Top Graphic: Fanned out realistic mobile cards */}
                <div className="relative h-64 w-full flex items-center justify-center overflow-hidden py-4">
                  {/* Back Card (xray / tags) */}
                  <div className="absolute w-56 bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-md transform -rotate-12 -translate-x-12 -translate-y-2 transition-transform duration-500 group-hover:-rotate-[14deg] group-hover:-translate-x-14">
                    <div className="flex gap-1.5 pb-2 border-b border-slate-100">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Prescription
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                        Report
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                        Scan
                      </span>
                    </div>
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] text-slate-400">Record name</p>
                      <div className="h-6 rounded-lg bg-slate-50 border border-slate-200/80 px-2 flex items-center text-[10px] text-slate-400">
                        Chest X-Ray
                      </div>
                      <p className="text-[10px] text-slate-400">Doctor</p>
                      <div className="h-6 rounded-lg bg-slate-50 border border-slate-200/80 px-2 flex items-center text-[10px] text-slate-600 font-semibold">
                        Dr. Amit Ved
                      </div>
                    </div>
                  </div>

                  {/* Middle Card (More Options) */}
                  <div className="absolute w-52 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-lg transform -rotate-3 translate-y-1 transition-transform duration-500 group-hover:-rotate-4 group-hover:scale-[1.02]">
                    <p className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">More Options</p>
                    <div className="pt-2 space-y-1.5 text-[11px] font-medium text-slate-700">
                      <div className="p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between">
                        <span>Follow Up</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between">
                        <span>Edit Visit</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center justify-between font-semibold">
                        <span>Delete Visit</span>
                      </div>
                    </div>
                  </div>

                  {/* Front Card (Add new visit modal) */}
                  <div className="absolute w-60 bg-white rounded-2xl p-4 border border-slate-300 shadow-xl transform rotate-6 translate-x-12 translate-y-3 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:translate-x-14">
                    <p className="text-xs font-bold text-slate-900">Add new visit</p>
                    <p className="text-[10px] text-slate-400 pb-2">Enter details regarding your visit</p>
                    <div className="space-y-2 text-[10px]">
                      <div>
                        <span className="text-slate-500 font-medium">Hospital/Clinic</span>
                        <div className="h-6 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-slate-600 font-semibold">
                          Fortis Memorial
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Doctor</span>
                        <div className="h-6 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-slate-600 font-semibold">
                          Dr. Ananya Sen
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="pt-6 space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Log every visit in seconds.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Add a doctor visit, attach prescriptions & reports underneath. Your medical history, in order, exactly as it happened.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            {/* CARD 2: All your documents, one tap away (Orbital Doctor Avatar Network) */}
            <RevealOnScroll delay={200} className="h-full">
              <div className="rounded-[2.2rem] bg-[#EAF5FC] border border-[#D5EBF8] p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-lg transition-all duration-500 group">
                
                {/* Top Graphic: Central App Icon with Concentric Orbiting Doctors */}
                <div className="relative h-64 w-full flex items-center justify-center">
                  {/* Concentric subtle rings */}
                  <div className="absolute w-56 h-56 rounded-full border border-blue-200/70 animate-pulse-subtle" />
                  <div className="absolute w-40 h-40 rounded-full border border-blue-200/90" />

                  {/* Center App Icon with Glow */}
                  <div className="relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1E56A0] to-[#00A8CC] flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-transform duration-500">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </div>

                  {/* Orbiting Avatar 1 (Top Center) */}
                  <div className="absolute top-2 w-11 h-11 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 animate-float-gentle">
                    <div className="w-full h-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-[10px] font-bold text-blue-800">
                      👨‍⚕️ Dr. V
                    </div>
                  </div>

                  {/* Orbiting Avatar 2 (Top Left) */}
                  <div className="absolute top-8 left-8 w-11 h-11 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 animate-float">
                    <div className="w-full h-full bg-gradient-to-tr from-rose-100 to-pink-100 flex items-center justify-center text-[10px] font-bold text-rose-800">
                      👩‍⚕️ Dr. P
                    </div>
                  </div>

                  {/* Orbiting Avatar 3 (Top Right) */}
                  <div className="absolute top-8 right-8 w-11 h-11 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 animate-float" style={{ animationDelay: "-2s" }}>
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-100 to-teal-100 flex items-center justify-center text-[10px] font-bold text-emerald-800">
                      👨‍⚕️ Dr. K
                    </div>
                  </div>

                  {/* Orbiting Avatar 4 (Bottom Left) */}
                  <div className="absolute bottom-6 left-12 w-11 h-11 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 animate-float-gentle" style={{ animationDelay: "-3s" }}>
                    <div className="w-full h-full bg-gradient-to-tr from-amber-100 to-orange-100 flex items-center justify-center text-[10px] font-bold text-amber-800">
                      👨‍⚕️ Dr. A
                    </div>
                  </div>

                  {/* Orbiting Avatar 5 (Bottom Right) */}
                  <div className="absolute bottom-6 right-12 w-11 h-11 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 animate-float" style={{ animationDelay: "-4s" }}>
                    <div className="w-full h-full bg-gradient-to-tr from-purple-100 to-violet-100 flex items-center justify-center text-[10px] font-bold text-purple-800">
                      👨‍⚕️ Dr. S
                    </div>
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="pt-6 space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    All your documents, one tap away.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Upload via camera scan or PDF. Tag as prescription, report, or scan. Instantly access everything — anytime, from anywhere.
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* ROW 2: "No government ID. No insurance hooks." & "A lifetime of records, not just today's." (Matches Screenshot 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

            {/* CARD 3: No government ID. No insurance hooks. (Tilted Physical ID Cards) */}
            <RevealOnScroll delay={150} className="h-full">
              <div className="rounded-[2.2rem] bg-[#EAF5FC] border border-[#D5EBF8] p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-lg transition-all duration-500 group">
                
                {/* Top Graphic: Tilted PAN & Aadhaar Mockup Cards */}
                <div className="relative h-64 w-full flex items-center justify-center overflow-hidden py-4">
                  {/* Back PAN Card (Tilted -8deg) */}
                  <div className="absolute w-64 h-40 bg-gradient-to-tr from-blue-50 via-slate-100 to-indigo-50 rounded-2xl p-4 border border-slate-300 shadow-md transform -rotate-12 -translate-x-6 -translate-y-2 transition-transform duration-500 group-hover:-rotate-[14deg] group-hover:-translate-x-8">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-[10px] font-bold text-slate-700 uppercase">INCOME TAX DEPARTMENT</span>
                      <span className="text-[9px] font-bold text-slate-400">GOVT. OF INDIA</span>
                    </div>
                    <div className="pt-2 flex gap-3 items-center">
                      <div className="w-10 h-12 bg-slate-300/80 rounded-md flex items-center justify-center text-slate-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="w-24 h-2 bg-slate-300/80 rounded" />
                        <div className="w-16 h-2 bg-slate-200 rounded" />
                        <p className="text-[11px] font-mono font-bold text-slate-700 pt-1">ABCDE 1234F</p>
                      </div>
                    </div>
                  </div>

                  {/* Front Aadhaar Card (Tilted 6deg) */}
                  <div className="absolute w-64 h-40 bg-white rounded-2xl p-3.5 border border-slate-300 shadow-xl transform rotate-6 translate-x-6 translate-y-3 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:translate-x-8">
                    {/* Tricolor top header stripe */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-white to-emerald-500 rounded-full mb-2" />
                    
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2.5 items-center">
                        <div className="w-10 h-12 bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-20 h-2 bg-slate-300 rounded" />
                          <div className="w-14 h-2 bg-slate-200 rounded" />
                          <div className="w-16 h-2 bg-slate-200 rounded" />
                        </div>
                      </div>
                      {/* Sun emblem placeholder */}
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-[10px] font-bold">
                        ☀️
                      </div>
                    </div>

                    {/* Masked Aadhaar Number */}
                    <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="font-mono text-xs font-extrabold tracking-wider text-slate-900">
                        XXXX XXXX XXXX
                      </span>
                      <QrCode className="w-6 h-6 text-slate-600" />
                    </div>
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="pt-6 space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    No government ID. No insurance hooks.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Your data is yours alone — not tied to any government database, not accessible by insurers. Private by design.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            {/* CARD 4: A lifetime of records, not just today's. (Notification Stack) */}
            <RevealOnScroll delay={250} className="h-full">
              <div className="rounded-[2.2rem] bg-[#EAF5FC] border border-[#D5EBF8] p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-lg transition-all duration-500 group">
                
                {/* Top Graphic: Stack of realistic push notifications */}
                <div className="relative h-64 w-full flex flex-col justify-center space-y-3 py-2">
                  {/* Notification 1 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-sm flex items-start gap-3 transform hover:scale-[1.02] transition-transform">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E56A0] to-[#00A8CC] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M2 12h20" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">Your document was uploaded.</p>
                        <span className="text-[10px] text-slate-400 font-medium">12:41 AM</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Dr. Kiran&apos;s prescription is saved to your visit.
                      </p>
                    </div>
                  </div>

                  {/* Notification 2 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-sm flex items-start gap-3 transform hover:scale-[1.02] transition-transform">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E56A0] to-[#00A8CC] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M2 12h20" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">Shared link has expired.</p>
                        <span className="text-[10px] text-slate-400 font-medium">10:41 AM</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        The link you sent to Dr. Arjun has expired.
                      </p>
                    </div>
                  </div>

                  {/* Notification 3 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-sm flex items-start gap-3 transform hover:scale-[1.02] transition-transform">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E56A0] to-[#00A8CC] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M2 12h20" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">Finish adding your visit.</p>
                        <span className="text-[10px] text-slate-400 font-medium">20:41 AM</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Logging a visit with Dr. Mehta, tap to complete it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="pt-6 space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    A lifetime of records, not just today&apos;s.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Health is a long story. Mediwallet keeps it all — from that scan three years ago to yesterday&apos;s blood test, one continuous timeline.
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* ROW 3: TWO COMPLEMENTARY INTERACTIVE HIGHLIGHT CARDS (Time-Lock Consent & RxScript Neural OCR) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
            
            {/* Interactive Card A: Share Securely with Expiration Control */}
            <RevealOnScroll delay={300} className="h-full">
              <div className="rounded-[2.2rem] bg-gradient-to-br from-[#F0FDF4] to-[#F5FCF8] border border-emerald-100 p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-lg transition-all duration-500">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-teal-600 shadow-xs">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Share securely. Your rules.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Generate time-locked QR codes or encrypted consultation links for doctors. When your appointment ends, doctor access auto-expires. One-tap revocation gives you total sovereignty.
                  </p>
                </div>

                {/* Interactive Duration Slider */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-3 mt-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Doctor Access Expiration</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {consentHours} Hours
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[4, 12, 24, 72].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => setConsentHours(hrs)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          consentHours === hrs
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {hrs}h
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Doctor preview automatically revokes after {consentHours} hours.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Interactive Card B: RxScript Neural Vision OCR */}
            <RevealOnScroll delay={350} className="h-full">
              <div className="rounded-[2.2rem] bg-gradient-to-br from-[#E6F8F2] to-[#EFFDF7] border border-emerald-100 p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-lg transition-all duration-500">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    RxScript neural OCR pipeline.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Indian doctors&apos; cursive handwriting transcribed by neural vision models in 2.5 seconds. Automatically mapped against the Indian Pharmacopoeia drug database with dosage warnings.
                  </p>
                </div>

                {/* OCR Demonstration Strip */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-2 mt-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">TrOCR Vision Model</span>
                    <span className="text-emerald-700 font-bold text-[11px]">94.8% Match</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700 space-y-1">
                    <p>1. Tab Azithromycin 500 mg — 1 OD × 3 days</p>
                    <p>2. Tab Cetirizine 10 mg — 1 HS × 5 days</p>
                    <p>3. Tab Paracetamol 650 mg — SOS</p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </section>

      {/* ===================== HOW IT WORKS / 3 SIMPLE STEPS ===================== */}
      <section id="how-it-works" className="relative z-10 py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto space-y-12">
          <RevealOnScroll delay={50}>
            <div className="space-y-3 text-center sm:text-left">
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-normal text-slate-900">
                Getting started
              </h2>
              <p className="text-slate-500 text-sm sm:text-base max-w-xl">
                Your full health history, in 3 simple steps. No paperwork. No clinic calls. Just everything you need, right here.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create your Vault",
                desc: "Sign up in 30 seconds. Set your personal vault master password. All files are encrypted using memory-hard Argon2id.",
              },
              {
                step: "02",
                title: "Snap or Upload",
                desc: "Upload medical PDFs, or snap prescription photos. Our neural vision pipeline immediately indexes medicines and biomarkers.",
              },
              {
                step: "03",
                title: "Share on your terms",
                desc: "Scan to show doctors via temporary QR codes or download clean PDF health summaries. Revoke access whenever you wish.",
              },
            ].map((s, idx) => (
              <RevealOnScroll key={s.step} delay={100 + idx * 100}>
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3 flow-card h-full">
                  <span className="text-3xl font-extrabold text-emerald-600 font-serif-editorial">{s.step}</span>
                  <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ===================== EXACT GOMMR.IN PRICING SECTION ==================== */}
      {/* ========================================================================= */}
      <section id="pricing" className="relative z-10 py-24 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Section Heading & Monthly / Annual Switch */}
          <RevealOnScroll delay={50}>
            <div className="flex flex-col items-center justify-center space-y-5 text-center">
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-normal text-slate-900">
                Simple, transparent pricing
              </h2>
              <p className="text-slate-500 text-sm max-w-md">
                Start free forever, or upgrade for advanced AI analysis, WhatsApp dose reminders, and unlimited doctor sharing.
              </p>

              {/* Pill Toggle matching gommr.in */}
              <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold shadow-xs">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-full transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                    billingCycle === "annual"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Annual</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2563EB] text-white">
                    Save up to 30%
                  </span>
                </button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Golden Highlight Banner (Exact gommr.in copy & style) */}
          <RevealOnScroll delay={100}>
            <div className="rounded-2xl bg-[#FEF9C3]/80 border border-[#FDE047] p-5 sm:p-6 flex items-start gap-3.5 shadow-xs max-w-4xl mx-auto">
              <span className="text-2xl shrink-0">🎁</span>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-[#854D0E]">
                  New members get 1 Month Pro — FREE!
                </h4>
                <p className="text-xs sm:text-sm text-[#A16207] leading-relaxed">
                  Sign up today and your first 30 days are on us — full Pro features: 20 uploads, 150 AI chats, unlimited doctor sharing. No credit card needed.
                </p>
              </div>
            </div>
          </RevealOnScroll>

          {/* 4 PRICING CARDS (Exact match to gommr.in screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pt-2">

            {/* CARD 1: FREE */}
            <RevealOnScroll delay={150} className="h-full">
              <div className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all flow-card h-full">
                <div className="space-y-5">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Zap className="w-5 h-5" />
                  </div>

                  {/* Tier Name & Price */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Free</h3>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl font-extrabold text-slate-900">₹0</span>
                    </div>
                    <p className="text-xs text-slate-500 pt-0.5">Always free</p>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>3 document uploads / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>10 AI chat messages / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>2 AI health insights / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>5 voice notes / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>3 AI health reports / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>2 doctor shares / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Secure Health Vault</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>WhatsApp document upload</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/signup"
                    className="w-full block text-center py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </RevealOnScroll>

            {/* CARD 2: BASIC */}
            <RevealOnScroll delay={200} className="h-full">
              <div className="rounded-3xl bg-white border border-blue-200 p-6 flex flex-col justify-between shadow-xs hover:border-blue-300 transition-all flow-card h-full relative">
                {/* Badge: New tier */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2563EB] text-white shadow-xs">
                    New tier
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Plus className="w-5 h-5" />
                  </div>

                  {/* Tier Name & Price */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Basic</h3>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {billingCycle === "monthly" ? "₹79" : "₹58"}
                      </span>
                      <span className="text-xs text-slate-500">/month</span>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold pt-0.5">
                      ₹699 / year (save 26%) →
                    </p>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>8 document uploads / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>50 AI chat messages / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>8 AI health insights / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>25 voice notes / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>10 AI health reports / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>5 doctor shares / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>PDF health summary export</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-slate-800">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Everything in Free</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/signup"
                    className="w-full block text-center py-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  >
                    Choose Basic
                  </Link>
                </div>
              </div>
            </RevealOnScroll>

            {/* CARD 3: PRO (MOST POPULAR) */}
            <RevealOnScroll delay={250} className="h-full">
              <div className="rounded-3xl bg-white border-2 border-[#3B82F6] p-6 flex flex-col justify-between shadow-xl shadow-blue-500/15 hover:shadow-2xl transition-all flow-card h-full relative scale-[1.02]">
                {/* Badge: Most Popular */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-[11px] font-extrabold bg-[#1D4ED8] text-white shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Most Popular</span>
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                    <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
                  </div>

                  {/* Tier Name & Price */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Pro</h3>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {billingCycle === "monthly" ? "₹149" : "₹108"}
                      </span>
                      <span className="text-xs text-slate-500">/month</span>
                    </div>
                    <p className="text-xs text-blue-700 font-semibold pt-0.5">
                      ₹1,299 / year (save 27%) →
                    </p>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-3 text-xs text-slate-700 pt-3 border-t border-slate-100">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-900">20 document uploads / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>150 AI chat messages / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>20 AI health insights / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>60 voice notes / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>25 AI health reports / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-semibold text-blue-700">Unlimited doctor shares</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Drug interaction alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Lab trend tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>PDF health summary export</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/signup"
                    className="w-full block text-center py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-colors shadow-md"
                  >
                    Start 30-Day Free Trial
                  </Link>
                </div>
              </div>
            </RevealOnScroll>

            {/* CARD 4: PRO PLUS (BEST VALUE) */}
            <RevealOnScroll delay={300} className="h-full">
              <div className="rounded-3xl bg-white border-2 border-[#A855F7] p-6 flex flex-col justify-between shadow-lg shadow-purple-500/10 hover:shadow-xl transition-all flow-card h-full relative">
                {/* Badge: Best Value */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-[11px] font-extrabold bg-[#7E22CE] text-white shadow-sm flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-white" />
                    <span>Best Value</span>
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                    <Crown className="w-5 h-5" />
                  </div>

                  {/* Tier Name & Price */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Pro Plus</h3>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {billingCycle === "monthly" ? "₹299" : "₹208"}
                      </span>
                      <span className="text-xs text-slate-500">/month</span>
                    </div>
                    <p className="text-xs text-purple-700 font-semibold pt-0.5">
                      ₹2,499 / year (save 30%) →
                    </p>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-3 text-xs text-slate-700 pt-3 border-t border-slate-100">
                    {/* Highlight pill */}
                    <li className="font-extrabold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span>📲</span>
                      <span>WHATSAPP REMINDERS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>50 document uploads / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>400 AI chat messages / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>50 AI health insights / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>150 voice notes / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>60 AI health reports / month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span className="font-semibold">Unlimited doctor shares</span>
                    </li>
                    <li className="flex items-start gap-2 font-bold text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                      <span>💊</span>
                      <span>WhatsApp dose reminders (3× daily, meal timing)</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/signup"
                    className="w-full block text-center py-3 rounded-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold transition-colors shadow-md"
                  >
                    Get Pro Plus
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===================== DOCTOR REVIEWS / TESTIMONIALS ===================== */}
      <section id="doctors" className="relative z-10 py-24 px-4 bg-[#F2FAF6] border-t border-emerald-100">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <RevealOnScroll delay={50}>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Clinical Perspectives
            </span>

            {/* Testimonial Quote */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-sm space-y-6 flow-card mt-4">
              <p className="font-serif-editorial text-2xl sm:text-3xl text-slate-800 leading-snug font-normal italic">
                {testimonials[activeTestimonial].quote}
              </p>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  {testimonials[activeTestimonial].name}
                </h4>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  {testimonials[activeTestimonial].role}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  {testimonials[activeTestimonial].hospital}
                </p>
              </div>

              {/* Testimonial Dots */}
              <div className="flex items-center justify-center gap-2 pt-4">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      activeTestimonial === i
                        ? "w-8 bg-emerald-600"
                        : "w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===================== FAQS (gommr.in Accordion) ===================== */}
      <section id="faqs" className="relative z-10 py-24 px-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto space-y-10">
          <RevealOnScroll delay={50}>
            <div className="text-center space-y-2">
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-normal text-slate-900">
                Frequently asked questions
              </h2>
              <p className="text-slate-500 text-sm">
                Everything you need to know about privacy, doctor sharing, and vault security.
              </p>
            </div>
          </RevealOnScroll>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <RevealOnScroll key={i} delay={100 + i * 50}>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-slate-300 transition-colors">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left text-sm font-bold text-slate-900"
                    >
                      <span>{faq.q}</span>
                      <span className="text-slate-400 text-lg shrink-0 font-mono">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 px-4 lg:px-8 pt-16 pb-12 mt-auto">
        <div className="max-w-6xl mx-auto space-y-14">

          {/* Top Big Callout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-slate-800">
            <div className="space-y-2 max-w-xl">
              <h3 className="font-serif-editorial text-3xl sm:text-4xl text-white font-normal">
                Your health history deserves better than a drawer.
              </h3>
              <p className="text-xs text-slate-400">
                Join thousands of patients who carry their complete medical memory in a cryptographically secured vault.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-md"
              >
                Create Free Vault
              </Link>
              <Link
                href="/doctor"
                className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700"
              >
                Doctor Portal
              </Link>
            </div>
          </div>

          {/* Footer Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold text-white">MEDIWALLET</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                India&apos;s Patient-Owned Medical Authority System. Private by design.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-2.5">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Product</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link href="/vault" className="hover:text-emerald-400 transition-colors">Medical Vault</Link></li>
                <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">RxScript ML OCR</Link></li>
                <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Emergency QR Card</Link></li>
                <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Family Biometrics</Link></li>
              </ul>
            </div>

            {/* Doctors */}
            <div className="space-y-2.5">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Doctors</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link href="/doctor" className="hover:text-emerald-400 transition-colors">OPD QR Scan</Link></li>
                <li><Link href="/doctor" className="hover:text-emerald-400 transition-colors">Admission Records</Link></li>
                <li><Link href="/admin" className="hover:text-emerald-400 transition-colors">Hospital Authority</Link></li>
              </ul>
            </div>

            {/* Legal & Helpline */}
            <div className="space-y-2.5">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Helpline & Support</span>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li className="text-emerald-400 font-semibold">1800-200-4422 (Toll-Free)</li>
                <li>support@mediwallet.health</li>
                <li>Hyderabad • Bengaluru • Mumbai</li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 MEDIWALLET. All rights reserved. Zero-Knowledge Patient Controlled Architecture.
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300">Terms of Service</a>
              <a href="#" className="hover:text-slate-300">Security Architecture</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
