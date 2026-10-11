"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Upload,
  FileText,
  Search,
  Eye,
  Download,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Building,
  User,
  Calendar,
  X,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  ChevronDown,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  FileCheck2,
  Check,
  Info,
  KeyRound,
  FileImage,
  Layers
} from "lucide-react";
import {
  fetchApi,
  uploadFileApi,
  getVaultStatus,
  setupVaultPassword,
  unlockVault,
  lockVault,
  renameRecord,
  deleteRecord,
  getRecordPreviewUrl,
  getRecordDownloadUrl,
  getVaultToken,
  clearVaultToken
} from "@/lib/api";

const CATEGORIES = [
  "All",
  "Prescriptions",
  "Lab Reports",
  "Scan Reports",
  "Discharge Summaries",
  "Other Documents"
];

interface MedicalVaultViewProps {
  initialRecords?: any[];
  onRecordCountChange?: (count: number) => void;
}

export default function MedicalVaultView({
  initialRecords = [],
  onRecordCountChange
}: MedicalVaultViewProps) {
  // Vault state
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [lockoutSecs, setLockoutSecs] = useState<number>(0);
  const [sessionRemaining, setSessionRemaining] = useState<number>(1200); // 20 minutes in seconds

  // Modals
  const [unlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);
  const [setupModalOpen, setSetupModalOpen] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [viewerModalOpen, setViewerModalOpen] = useState<boolean>(false);
  const [renameModalOpen, setRenameModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // Forms & Inputs
  const [vaultPassword, setVaultPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [setupPassword, setSetupPassword] = useState<string>("");
  const [setupConfirm, setSetupConfirm] = useState<string>("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Records state
  const [records, setRecords] = useState<any[]>(initialRecords);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [recordToRename, setRecordToRename] = useState<any | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>("");
  const [renameCategory, setRenameCategory] = useState<string>("Lab Reports");

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "title_asc" | "title_desc">("date_desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Upload Form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<string>("Lab Reports");
  const [uploadHospital, setUploadHospital] = useState<string>("");
  const [uploadDoctor, setUploadDoctor] = useState<string>("");
  const [uploadDate, setUploadDate] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDuplicateWarning, setUploadDuplicateWarning] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Viewer state
  const [viewerZoom, setViewerZoom] = useState<number>(100);
  const [viewerRotation, setViewerRotation] = useState<number>(0);

  // Activity timer
  const lastActivityRef = useRef<number>(0);
  const sessionIntervalRef = useRef<any>(null);

  // Initialize client date on mount
  useEffect(() => {
    setUploadDate(new Date().toISOString().split("T")[0]);
    lastActivityRef.current = Date.now();
  }, []);

  // Load vault status and records on mount
  const checkStatus = useCallback(async () => {
    try {
      const status = await getVaultStatus();
      setIsConfigured(status.is_configured);
      setIsUnlocked(status.is_unlocked);
      setFailedAttempts(status.failed_attempts || 0);
      setIsLockedOut(status.is_locked_out || false);
      setLockoutSecs(status.lockout_remaining_seconds || 0);

      const recs = await fetchApi(`/records?sort_by=${sortBy}`);
      setRecords(recs);
      if (onRecordCountChange) onRecordCountChange(recs.length);
    } catch (err) {
      console.warn("Status check fallback:", err);
    }
  }, [sortBy, onRecordCountChange]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Activity tracking for auto-relock
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("touchstart", resetActivity);
    window.addEventListener("scroll", resetActivity);

    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("touchstart", resetActivity);
      window.removeEventListener("scroll", resetActivity);
    };
  }, [resetActivity]);

  // Inactivity auto-relock check (every 10 seconds)
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      // 10 minutes of idle time = 600,000 ms
      if (idleTime > 10 * 60 * 1000) {
        handleLockVault();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isUnlocked]);

  // Session countdown timer
  useEffect(() => {
    if (isUnlocked) {
      setSessionRemaining(1200); // 20 minutes
      sessionIntervalRef.current = setInterval(() => {
        setSessionRemaining((prev) => {
          if (prev <= 1) {
            handleLockVault();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    }
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [isUnlocked]);

  // Handle Unlock
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlockError(null);
    setIsSubmittingAuth(true);

    try {
      const res = await unlockVault(vaultPassword);
      setIsUnlocked(true);
      setUnlockModalOpen(false);
      setVaultPassword("");
      confetti({ particleCount: 50, spread: 50 });
      await checkStatus();
    } catch (err: any) {
      setUnlockError(err.message || "Failed to unlock vault. Please check your password.");
      await checkStatus();
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  // Handle Setup
  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setSetupError(null);

    if (setupPassword !== setupConfirm) {
      setSetupError("Passwords do not match.");
      return;
    }

    if (setupPassword.length < 8) {
      setSetupError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await setupVaultPassword(setupPassword, setupConfirm);
      setIsConfigured(true);
      setIsUnlocked(true);
      setSetupModalOpen(false);
      setSetupPassword("");
      setSetupConfirm("");
      confetti({ particleCount: 70, spread: 60 });
      await checkStatus();
    } catch (err: any) {
      setSetupError(err.message || "Failed to configure vault password.");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  // Handle Lock
  async function handleLockVault() {
    try {
      await lockVault();
    } catch (e) {
      clearVaultToken();
    }
    setIsUnlocked(false);
    setViewerModalOpen(false);
  }

  // Handle Drag & Drop Upload
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetUploadFile(file);
    }
  }

  function validateAndSetUploadFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext || "")) {
      setUploadError("Invalid file type. Only PDF, JPG, and PNG are supported.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File exceeds maximum allowed size of 25MB.");
      return;
    }
    setUploadError(null);
    setUploadFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function handleExecuteUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setUploadError(null);
    setUploadDuplicateWarning(null);

    const formData = new FormData();
    formData.append("title", uploadTitle || uploadFile.name);
    formData.append("category", uploadCategory);
    formData.append("doctor_name", uploadDoctor || "Consulting Physician");
    formData.append("hospital_name", uploadHospital || "Healthcare Facility");
    formData.append("record_date", uploadDate);
    formData.append("file", uploadFile);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);

    try {
      const res = await uploadFileApi("/records/upload", formData);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (res.is_duplicate) {
        setUploadDuplicateWarning(res);
      } else {
        confetti({ particleCount: 65, spread: 60 });
        setUploadModalOpen(false);
        resetUploadForm();
        await checkStatus();
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setUploadError(err.message || "Failed to upload document. Please retry.");
    } finally {
      setIsUploading(false);
    }
  }

  function resetUploadForm() {
    setUploadFile(null);
    setUploadTitle("");
    setUploadCategory("Lab Reports");
    setUploadHospital("");
    setUploadDoctor("");
    setUploadDate(new Date().toISOString().split("T")[0]);
    setUploadProgress(0);
    setUploadError(null);
    setUploadDuplicateWarning(null);
  }

  // Handle Document Preview Click
  function handleOpenRecord(record: any) {
    if (!isUnlocked) {
      setSelectedRecord(record);
      setUnlockModalOpen(true);
      return;
    }
    setSelectedRecord(record);
    setViewerZoom(100);
    setViewerRotation(0);
    setViewerModalOpen(true);
  }

  // Handle Document Download Click
  function handleDownloadRecord(record: any) {
    if (!isUnlocked) {
      setSelectedRecord(record);
      setUnlockModalOpen(true);
      return;
    }
    const downloadUrl = getRecordDownloadUrl(record.id);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = record.file_name || "medical_record.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Handle Rename
  async function handleExecuteRename(e: React.FormEvent) {
    e.preventDefault();
    if (!recordToRename || !renameTitle.trim()) return;

    try {
      await renameRecord(recordToRename.id, {
        title: renameTitle.trim(),
        category: renameCategory
      });
      setRenameModalOpen(false);
      setRecordToRename(null);
      await checkStatus();
    } catch (err: any) {
      alert("Failed to rename record: " + (err.message || "Unknown error"));
    }
  }

  // Handle Delete
  async function handleExecuteDelete() {
    if (!recordToDelete) return;
    try {
      await deleteRecord(recordToDelete.id);
      setDeleteModalOpen(false);
      setRecordToDelete(null);
      await checkStatus();
    } catch (err: any) {
      alert("Failed to delete record: " + (err.message || "Unknown error"));
    }
  }

  // Filtered & Sorted Records
  const filteredRecords = records.filter((r) => {
    const matchesCategory =
      selectedCategory === "All" ||
      r.category.toLowerCase().includes(selectedCategory.toLowerCase().replace("s", ""));
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.doctor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.hospital_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.ai_summary || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Password Strength for Setup
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 3 || score === 4) return { score: 2, label: "Good", color: "bg-amber-500" };
    return { score: 3, label: "Strong", color: "bg-[#168653]" };
  };

  const strength = getPasswordStrength(setupPassword);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===================== HERO VAULT PRIORITY BANNER ===================== */}
      <div className="rounded-3xl bg-white border border-[#DDE7DF] p-6 lg:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-5 pointer-events-none flex items-center justify-center">
          <Shield className="w-80 h-80 text-[#168653]" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6EE] text-[#126640] border border-[#DDE7DF] text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-[#168653]" />
                <span>Patient-Controlled Health Vault</span>
              </span>

              {isUnlocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Vault Unlocked ({formatSeconds(sessionRemaining)})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#647067] text-[11px] font-bold border border-[#DDE7DF]">
                  <Lock className="w-3.5 h-3.5 text-[#647067]" />
                  <span>Vault Protected & Locked</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26352B] tracking-tight">
              Your Health. Your Records. Your Control.
            </h1>

            <p className="text-xs sm:text-sm text-[#647067] leading-relaxed">
              Every medical record in your vault is strictly protected with server-side authorization,
              SHA-256 duplicate detection, and memory-hard Scrypt key derivation. Unauthorized previews and downloads are blocked.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isUnlocked ? (
              <button
                onClick={handleLockVault}
                className="px-4 py-2.5 rounded-2xl bg-white border border-[#DDE7DF] hover:bg-[#F5F8F5] text-[#26352B] font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <Lock className="w-4 h-4 text-[#168653]" />
                <span>Lock Vault</span>
              </button>
            ) : isConfigured ? (
              <button
                onClick={() => setUnlockModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#168653] hover:bg-[#126640] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock My Vault</span>
              </button>
            ) : (
              <button
                onClick={() => setSetupModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#168653] hover:bg-[#126640] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                <span>Setup Vault Password</span>
              </button>
            )}

            <button
              onClick={() => {
                setUploadModalOpen(true);
                resetUploadForm();
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#168653] hover:bg-[#126640] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Medical Record</span>
            </button>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 pt-5 border-t border-[#DDE7DF] grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-[#F5F8F5] border border-[#DDE7DF]">
            <span className="text-[10px] uppercase font-bold text-[#647067] block">Protection</span>
            <span className="text-xs font-bold text-[#26352B] mt-0.5 block">Scrypt Memory-Hard</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F5F8F5] border border-[#DDE7DF]">
            <span className="text-[10px] uppercase font-bold text-[#647067] block">Integrity</span>
            <span className="text-xs font-bold text-[#26352B] mt-0.5 block">SHA-256 Fingerprint</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F5F8F5] border border-[#DDE7DF]">
            <span className="text-[10px] uppercase font-bold text-[#647067] block">Access Control</span>
            <span className="text-xs font-bold text-[#26352B] mt-0.5 block">Zero-IDOR Partitioned</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F5F8F5] border border-[#DDE7DF]">
            <span className="text-[10px] uppercase font-bold text-[#647067] block">Auto-Relock</span>
            <span className="text-xs font-bold text-[#26352B] mt-0.5 block">10 Min Inactivity</span>
          </div>
        </div>
      </div>

      {/* ===================== SEARCH, FILTER & CONTROLS ===================== */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#647067] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, doctor, hospital, or clinical terms..."
              className="w-full bg-white text-xs text-[#26352B] pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDE7DF] focus:border-[#168653] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-[#647067] hover:text-[#26352B]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort and View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-white text-xs text-[#26352B] font-semibold px-3 py-2.5 rounded-2xl border border-[#DDE7DF] focus:border-[#168653] cursor-pointer appearance-none pr-8"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#647067] absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <div className="flex items-center bg-white rounded-2xl border border-[#DDE7DF] p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === "grid" ? "bg-[#EAF6EE] text-[#168653]" : "text-[#647067] hover:text-[#26352B]"
                }`}
                title="Grid View"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === "table" ? "bg-[#EAF6EE] text-[#168653]" : "text-[#647067] hover:text-[#26352B]"
                }`}
                title="List View"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#168653] text-white shadow-2xs font-bold"
                    : "bg-white text-[#647067] hover:text-[#26352B] border border-[#DDE7DF] hover:border-[#168653]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================== RECORDS DISPLAY (GRID OR TABLE) ===================== */}
      {filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl bg-white border border-[#DDE7DF] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EAF6EE] text-[#168653] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#26352B]">No Medical Records Found</h3>
            <p className="text-xs text-[#647067] max-w-md mx-auto">
              {searchQuery || selectedCategory !== "All"
                ? "No documents matched your current search or category filter. Try clearing your filters."
                : "Your personal medical vault is empty. Securely upload your first diagnostic lab report, prescription, or scan to get started."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            {searchQuery || selectedCategory !== "All" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 rounded-xl bg-white border border-[#DDE7DF] text-xs font-semibold text-[#26352B] hover:bg-[#F5F8F5]"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setUploadModalOpen(true);
                  resetUploadForm();
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#168653] hover:bg-[#126640] text-white font-bold text-xs flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload First Record</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((r) => {
            const isPdf = (r.file_name || "").toLowerCase().endsWith(".pdf");
            return (
              <div
                key={r.id}
                className="rounded-2xl bg-white border border-[#DDE7DF] hover:border-[#168653] transition-all p-5 space-y-4 shadow-xs flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6EE] text-[#126640] border border-[#DDE7DF]">
                      {r.category}
                    </span>
                    <span className="text-[11px] text-[#647067] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#647067]" />
                      {r.record_date}
                    </span>
                  </div>

                  {/* Title & Facility */}
                  <div>
                    <h3 className="text-sm font-bold text-[#26352B] line-clamp-1 group-hover:text-[#168653] transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-[#647067] mt-1 flex items-center gap-1.5 line-clamp-1">
                      <Building className="w-3.5 h-3.5 text-[#647067] shrink-0" />
                      <span>{r.hospital_name || "Healthcare Clinic"}</span>
                      <span>•</span>
                      <span>{r.doctor_name || "Doctor"}</span>
                    </p>
                  </div>

                  {/* Diagnostic Alert or Normal Badge */}
                  {r.is_abnormal ? (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold">Lab values outside printed reference range</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-[#EAF6EE] border border-[#DDE7DF] text-[#126640] text-[11px] flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#168653] shrink-0" />
                      <span>All Diagnostic Parameters Normal</span>
                    </div>
                  )}

                  {/* Clinical AI Summary Snippet */}
                  {r.ai_summary && (
                    <p className="text-[11px] text-[#26352B] line-clamp-2 leading-relaxed bg-[#F5F8F5] p-2.5 rounded-xl border border-[#DDE7DF]">
                      {r.ai_summary}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#DDE7DF] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenRecord(r)}
                      className="px-3 py-1.5 rounded-xl bg-[#168653] hover:bg-[#126640] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                      title={isUnlocked ? "Preview Document" : "Unlock to Preview"}
                    >
                      {isUnlocked ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isUnlocked ? "Preview" : "Unlock"}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadRecord(r)}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#EAF6EE] text-[#647067] hover:text-[#168653] border border-[#DDE7DF] transition-all"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setRecordToRename(r);
                        setRenameTitle(r.title);
                        setRenameCategory(r.category);
                        setRenameModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-[#647067] hover:text-[#26352B]"
                      title="Rename Document"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setRecordToDelete(r);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-[#647067] hover:text-rose-600"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl bg-white border border-[#DDE7DF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8F5] text-[#647067] font-bold uppercase tracking-wider border-b border-[#DDE7DF]">
                <tr>
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Doctor & Facility</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Diagnostic Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE7DF] text-[#26352B]">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F5F8F5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#168653] shrink-0" />
                      <span className="line-clamp-1">{r.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6EE] text-[#126640] border border-[#DDE7DF]">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#647067]">
                      <span>{r.hospital_name || "Facility"}</span>
                      {r.doctor_name && <span className="text-[11px] block">{r.doctor_name}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-[#647067] whitespace-nowrap">{r.record_date}</td>
                    <td className="py-3.5 px-4">
                      {r.is_abnormal ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Attention
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRecord(r)}
                          className="px-2.5 py-1 rounded-lg bg-[#168653] hover:bg-[#126640] text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadRecord(r)}
                          className="p-1 rounded-lg bg-white border border-[#DDE7DF] text-[#647067] hover:text-[#168653]"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setRecordToRename(r);
                            setRenameTitle(r.title);
                            setRenameCategory(r.category);
                            setRenameModalOpen(true);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-[#647067]"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setRecordToDelete(r);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: UNLOCK VAULT PASSWORD DIALOG
      ========================================================================= */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DDE7DF] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF6EE] text-[#168653] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#26352B]">Unlock Medical Vault</h3>
                  <p className="text-xs text-[#647067]">Enter your vault password to access protected files.</p>
                </div>
              </div>
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-[#647067]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {unlockError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#26352B] block">Vault Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Enter vault password..."
                    required
                    autoFocus
                    className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-4 py-3 rounded-2xl border border-[#DDE7DF] focus:border-[#168653] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-[#647067] hover:text-[#26352B]"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-[#EAF6EE] border border-[#DDE7DF] text-[11px] text-[#126640] flex items-center justify-between mt-1">
                  <span>Demo patient password: <strong>Vault@123</strong></span>
                  <button
                    type="button"
                    onClick={() => setVaultPassword("Vault@123")}
                    className="text-[10px] font-bold text-[#168653] hover:underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnlockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DDE7DF] text-xs font-semibold text-[#647067] hover:bg-[#F5F8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAuth || !vaultPassword}
                  className="px-6 py-2.5 rounded-xl bg-[#168653] hover:bg-[#126640] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  {isSubmittingAuth && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Unlock Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SETUP VAULT PASSWORD DIALOG
      ========================================================================= */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DDE7DF] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF6EE] text-[#168653] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#26352B]">Setup Vault Password</h3>
                  <p className="text-xs text-[#647067]">Configure dedicated memory-hard protection for your health documents.</p>
                </div>
              </div>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-[#647067]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {setupError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#26352B] block">New Vault Password</label>
                <input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="At least 8 characters with upper, lower & numbers..."
                  required
                  className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-4 py-2.5 rounded-2xl border border-[#DDE7DF] focus:border-[#168653]"
                />

                {/* Password Strength Meter */}
                {setupPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-[#647067]">
                      <span>Password Strength:</span>
                      <strong className="text-[#26352B]">{strength.label}</strong>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : "bg-transparent"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : "bg-transparent"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : "bg-transparent"}`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#26352B] block">Confirm Password</label>
                <input
                  type="password"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Re-enter your password..."
                  required
                  className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-4 py-2.5 rounded-2xl border border-[#DDE7DF] focus:border-[#168653]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DDE7DF] text-xs font-semibold text-[#647067] hover:bg-[#F5F8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAuth || !setupPassword}
                  className="px-6 py-2.5 rounded-xl bg-[#168653] hover:bg-[#126640] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  {isSubmittingAuth && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Unlock Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REAL UPLOAD MEDICAL RECORD (DRAG & DROP)
      ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DDE7DF] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6EE] text-[#126640] border border-[#DDE7DF]">
                  AES-256 Vault Ingestion
                </span>
                <h3 className="text-xl font-bold text-[#26352B] mt-1">Upload Medical Document</h3>
                <p className="text-xs text-[#647067]">
                  Accepted formats: PDF, JPG, JPEG, PNG (up to 25MB). Server verifies magic bytes.
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-[#647067]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadDuplicateWarning && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Duplicate Document Detected</span>
                </div>
                <p>{uploadDuplicateWarning.warning}</p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalOpen(false);
                      handleOpenRecord(uploadDuplicateWarning.record);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  >
                    View Existing Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadDuplicateWarning(null)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-semibold"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleExecuteUpload} className="space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? "border-[#168653] bg-[#EAF6EE]"
                    : uploadFile
                    ? "border-[#168653] bg-[#EAF6EE]/50"
                    : "border-[#DDE7DF] hover:border-[#168653] bg-[#F5F8F5]"
                }`}
              >
                {uploadFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#168653] text-white flex items-center justify-center mx-auto">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#26352B] block">{uploadFile.name}</span>
                      <span className="text-[11px] text-[#647067]">
                        {(uploadFile.size / 1024).toFixed(1)} KB • {uploadFile.type || "Medical File"}
                      </span>
                    </div>
                    <label className="inline-block text-xs font-bold text-[#168653] hover:underline cursor-pointer">
                      Change File
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) validateAndSetUploadFile(f);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF6EE] text-[#168653] flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#26352B]">
                        Drag and drop your medical file here, or{" "}
                        <label className="text-[#168653] hover:underline cursor-pointer">
                          browse
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) validateAndSetUploadFile(f);
                            }}
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-[11px] text-[#647067] mt-0.5">
                        PDF, JPG, JPEG, PNG up to 25MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#647067]">
                    <span>Encrypting & uploading to vault...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#168653] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Document Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#26352B]">Document Title *</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Complete Metabolic Blood Panel"
                    required
                    className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#26352B]">Category *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                  >
                    <option value="Lab Reports">Lab Reports</option>
                    <option value="Prescriptions">Prescriptions</option>
                    <option value="Scan Reports">Scan Reports</option>
                    <option value="Discharge Summaries">Discharge Summaries</option>
                    <option value="Other Documents">Other Documents</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#26352B]">Record Date</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#26352B]">Hospital / Lab Name</label>
                  <input
                    type="text"
                    value={uploadHospital}
                    onChange={(e) => setUploadHospital(e.target.value)}
                    placeholder="e.g. Apollo Health City"
                    className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#26352B]">Doctor Name</label>
                  <input
                    type="text"
                    value={uploadDoctor}
                    onChange={(e) => setUploadDoctor(e.target.value)}
                    placeholder="e.g. Dr. Priya Nair, MD"
                    className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DDE7DF] text-xs font-semibold text-[#647067] hover:bg-[#F5F8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-6 py-2.5 rounded-xl bg-[#168653] hover:bg-[#126640] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUploading ? "Encrypting & Storing..." : "Save to Vault"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: SECURE DOCUMENT VIEWER (PDF / IMAGE / CLINICAL METADATA)
      ========================================================================= */}
      {viewerModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl border border-[#DDE7DF] max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Viewer Header */}
            <div className="p-4 sm:p-5 border-b border-[#DDE7DF] flex items-center justify-between gap-4 bg-[#F5F8F5]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF6EE] text-[#168653] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6EE] text-[#126640] border border-[#DDE7DF]">
                      {selectedRecord.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#647067]">
                      SHA-256: {selectedRecord.sha256_hash?.substring(0, 10)}...
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#26352B] truncate mt-0.5">
                    {selectedRecord.title}
                  </h3>
                </div>
              </div>

              {/* Viewer Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setViewerZoom((z) => Math.max(50, z - 20))}
                  className="p-2 rounded-xl bg-white border border-[#DDE7DF] text-[#647067] hover:text-[#26352B]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-[#647067] hidden sm:inline px-1">
                  {viewerZoom}%
                </span>
                <button
                  onClick={() => setViewerZoom((z) => Math.min(200, z + 20))}
                  className="p-2 rounded-xl bg-white border border-[#DDE7DF] text-[#647067] hover:text-[#26352B]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewerRotation((r) => (r + 90) % 360)}
                  className="p-2 rounded-xl bg-white border border-[#DDE7DF] text-[#647067] hover:text-[#26352B]"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDownloadRecord(selectedRecord)}
                  className="px-3.5 py-2 rounded-xl bg-[#168653] hover:bg-[#126640] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  onClick={() => setViewerModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-[#647067]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewer Body: Split Content + Clinical Metadata */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Document Rendering Workspace */}
              <div className="flex-1 bg-[#26352B]/5 flex items-center justify-center p-4 overflow-auto min-h-0">
                {selectedRecord.file_name?.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={getRecordPreviewUrl(selectedRecord.id)}
                    title={selectedRecord.title}
                    className="w-full h-full rounded-xl shadow-md border border-[#DDE7DF] bg-white"
                    style={{
                      transform: `scale(${viewerZoom / 100}) rotate(${viewerRotation}deg)`,
                      transformOrigin: "center center"
                    }}
                  />
                ) : (
                  <div
                    className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full"
                    style={{
                      transform: `scale(${viewerZoom / 100}) rotate(${viewerRotation}deg)`
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getRecordPreviewUrl(selectedRecord.id)}
                      alt={selectedRecord.title}
                      className="max-h-[70vh] max-w-full rounded-xl shadow-lg border border-[#DDE7DF] object-contain bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Clinical Analysis & Metadata Sidebar */}
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[#DDE7DF] bg-white p-5 overflow-y-auto space-y-5">
                {/* Clinical Metadata */}
                <div className="space-y-3 pb-4 border-b border-[#DDE7DF]">
                  <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">
                    Document Metadata
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#647067]">Facility:</span>
                      <strong className="text-[#26352B]">{selectedRecord.hospital_name || "N/A"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#647067]">Doctor:</span>
                      <strong className="text-[#26352B]">{selectedRecord.doctor_name || "N/A"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#647067]">Record Date:</span>
                      <strong className="text-[#26352B]">{selectedRecord.record_date || "N/A"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#647067]">File Size:</span>
                      <strong className="text-[#26352B]">
                        {selectedRecord.file_size ? `${(selectedRecord.file_size / 1024).toFixed(1)} KB` : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Grounded AI Clinical Summary */}
                {selectedRecord.ai_summary && (
                  <div className="space-y-2 pb-4 border-b border-[#DDE7DF]">
                    <span className="text-[10px] font-bold text-[#168653] uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Clinical Summary
                    </span>
                    <p className="text-xs text-[#26352B] leading-relaxed bg-[#EAF6EE] p-3 rounded-xl border border-[#DDE7DF]">
                      {selectedRecord.ai_summary}
                    </p>
                  </div>
                )}

                {/* Structured Diagnostic Parameters */}
                {selectedRecord.structured_data && selectedRecord.structured_data.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">
                      Diagnostic Laboratory Parameters
                    </span>
                    <div className="space-y-2">
                      {selectedRecord.structured_data.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            item.status === "high" || item.flag
                              ? "bg-amber-50 border-amber-200 text-amber-900"
                              : "bg-[#F5F8F5] border-[#DDE7DF] text-[#26352B]"
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{item.test || item.medicine}</span>
                            <span className="text-[10px] text-[#647067]">
                              Ref: {item.ref_range || item.timing || "Standard"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold block">
                              {item.value || item.strength} {item.unit || ""}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#168653]">
                              {item.status || "Verified"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: RENAME RECORD MODAL
      ========================================================================= */}
      {renameModalOpen && recordToRename && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DDE7DF] max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in-up">
            <h3 className="text-base font-bold text-[#26352B]">Rename Document</h3>
            <form onSubmit={handleExecuteRename} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#26352B]">Document Title</label>
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  required
                  className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#26352B]">Category</label>
                <select
                  value={renameCategory}
                  onChange={(e) => setRenameCategory(e.target.value)}
                  className="w-full bg-[#F5F8F5] text-xs text-[#26352B] px-3.5 py-2.5 rounded-xl border border-[#DDE7DF] focus:border-[#168653]"
                >
                  <option value="Lab Reports">Lab Reports</option>
                  <option value="Prescriptions">Prescriptions</option>
                  <option value="Scan Reports">Scan Reports</option>
                  <option value="Discharge Summaries">Discharge Summaries</option>
                  <option value="Other Documents">Other Documents</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDE7DF] text-xs font-semibold text-[#647067]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#168653] hover:bg-[#126640] text-white font-bold text-xs"
                >
                  Update Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: DELETE RECORD CONFIRMATION
      ========================================================================= */}
      {deleteModalOpen && recordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DDE7DF] max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#26352B]">Permanently Delete Document?</h3>
              <p className="text-xs text-[#647067]">
                Are you sure you want to delete <strong>{recordToDelete.title}</strong>? This will permanently erase the stored file from your private vault and remove its database metadata. This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DDE7DF] text-xs font-semibold text-[#647067]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
