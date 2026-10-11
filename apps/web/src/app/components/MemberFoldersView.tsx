"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Folder,
  FolderPlus,
  FolderOpen,
  FolderLock,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserPlus,
  UserCheck,
  FileText,
  Upload,
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
  Calendar,
  X,
  Plus,
  ChevronRight,
  Filter,
  Check,
  Info,
  Mail,
  Phone,
  History,
  Settings,
  ArrowLeft,
  FileSpreadsheet,
  FileImage,
  Droplets,
  ExternalLink,
  Key
} from "lucide-react";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderDetails,
  addFolderMember,
  updateFolderMember,
  removeFolderMember,
  getFolderReports,
  uploadMemberReportApi,
  deleteMemberReport,
  getReportPreviewUrl,
  getReportDownloadUrl,
  getFolderSecurityStatus,
  setupReportAccessPassword,
  changeReportAccessPassword,
  updateFolderSecuritySettings,
  requestFolderOTP,
  verifyFolderOTP,
  verifyFolderPassword,
  revokeFolderSession,
  getFolderAuditLogs,
  getFolderAccessToken
} from "@/lib/api";

const DOCUMENT_TYPES = [
  "All",
  "Lab Report",
  "Prescription",
  "Scan Report",
  "Discharge Summary",
  "Vaccination Record",
  "Other"
];

const RELATIONSHIPS = [
  "Self",
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Grandparent",
  "Dependent",
  "Other"
];

const BLOOD_GROUPS = ["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function MemberFoldersView() {
  // Folder list & view state
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<any | null>(null);
  const [loadingFolders, setLoadingFolders] = useState<boolean>(true);
  const [folderSearch, setFolderSearch] = useState<string>("");

  // Reports & filtering inside active folder
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<number | null>(null);
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState<string>("All");
  const [reportSearch, setReportSearch] = useState<string>("");

  // Security status & session
  const [securityStatus, setSecurityStatus] = useState<any | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Modals
  const [createFolderModal, setCreateFolderModal] = useState<boolean>(false);
  const [editFolderModal, setEditFolderModal] = useState<boolean>(false);
  const [deleteFolderModal, setDeleteFolderModal] = useState<boolean>(false);
  const [addMemberModal, setAddMemberModal] = useState<boolean>(false);
  const [editMemberModal, setEditMemberModal] = useState<any | null>(null);
  const [uploadReportModal, setUploadReportModal] = useState<boolean>(false);
  const [verifyAccessModal, setVerifyAccessModal] = useState<boolean>(false);
  const [securitySettingsModal, setSecuritySettingsModal] = useState<boolean>(false);
  const [auditLogsModal, setAuditLogsModal] = useState<boolean>(false);
  const [previewReportModal, setPreviewReportModal] = useState<any | null>(null);

  // Form states - Folders
  const [folderName, setFolderName] = useState<string>("");
  const [folderDesc, setFolderDesc] = useState<string>("");

  // Form states - Members
  const [memberName, setMemberName] = useState<string>("");
  const [memberRelation, setMemberRelation] = useState<string>("Self");
  const [memberAge, setMemberAge] = useState<string>("");
  const [memberGender, setMemberGender] = useState<string>("Female");
  const [memberBlood, setMemberBlood] = useState<string>("B+");
  const [memberPhone, setMemberPhone] = useState<string>("");
  const [memberEmail, setMemberEmail] = useState<string>("");
  const [memberNotes, setMemberNotes] = useState<string>("");

  // Form states - Reports
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportMemberId, setReportMemberId] = useState<number | "">("");
  const [reportTitle, setReportTitle] = useState<string>("");
  const [reportDocType, setReportDocType] = useState<string>("Lab Report");
  const [reportDate, setReportDate] = useState<string>("");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);

  // Verification state (OTP & Password)
  const [verifyTab, setVerifyTab] = useState<"otp" | "password">("password");
  const [verifyPasswordInput, setVerifyPasswordInput] = useState<string>("");
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
  const [otpRequested, setOtpRequested] = useState<boolean>(false);
  const [otpMaskedTarget, setOtpMaskedTarget] = useState<string>("");
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>("");
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Security Settings Form states
  const [setupPasswordInput, setSetupPasswordInput] = useState<string>("");
  const [setupConfirmInput, setSetupConfirmInput] = useState<string>("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [newConfirmInput, setNewConfirmInput] = useState<string>("");
  const [allowedMethodsInput, setAllowedMethodsInput] = useState<string>("both");
  const [verifiedEmailInput, setVerifiedEmailInput] = useState<string>("");
  const [verifiedPhoneInput, setVerifiedPhoneInput] = useState<string>("");

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);

  // Pending action after unlocking
  const [pendingActionAfterUnlock, setPendingActionAfterUnlock] = useState<(() => void) | null>(null);

  const loadSecurityStatus = useCallback(async () => {
    try {
      const status = await getFolderSecurityStatus();
      setSecurityStatus(status);
      setIsUnlocked(status.is_unlocked);
      if (status.verified_email) setVerifiedEmailInput(status.verified_email);
      if (status.verified_phone) setVerifiedPhoneInput(status.verified_phone);
      if (status.allowed_access_methods) setAllowedMethodsInput(status.allowed_access_methods);
      if (status.allowed_access_methods === "otp_only") {
        setVerifyTab("otp");
      }
    } catch (err) {
      console.warn("Failed to load folder security status:", err);
    }
  }, []);

  const loadFoldersList = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (err: any) {
      console.error("Error loading folders:", err);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const loadActiveFolderReports = useCallback(async (folderId: number) => {
    setLoadingReports(true);
    try {
      const data = await getFolderReports(folderId, selectedMemberFilter || undefined, selectedDocTypeFilter, reportSearch);
      setReports(data);
    } catch (err: any) {
      console.error("Error loading reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, [selectedMemberFilter, selectedDocTypeFilter, reportSearch]);

  useEffect(() => {
    loadFoldersList();
    loadSecurityStatus();
  }, [loadFoldersList, loadSecurityStatus]);

  useEffect(() => {
    if (activeFolder) {
      loadActiveFolderReports(activeFolder.id);
    }
  }, [activeFolder, selectedMemberFilter, selectedDocTypeFilter, reportSearch, loadActiveFolderReports]);

  // Handle Opening Folder
  async function handleOpenFolder(folder: any) {
    try {
      const details = await getFolderDetails(folder.id);
      setActiveFolder(details);
      setSelectedMemberFilter(null);
      setSelectedDocTypeFilter("All");
      setReportSearch("");
    } catch (err: any) {
      alert("Error opening folder: " + (err.message || "Unknown error"));
    }
  }

  // Handle Create Folder
  async function handleCreateFolderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!folderName.trim()) return;
    try {
      const newF = await createFolder({
        name: folderName.trim(),
        description: folderDesc.trim() || undefined
      });
      confetti({ particleCount: 50, spread: 50 });
      setFolderName("");
      setFolderDesc("");
      setCreateFolderModal(false);
      await loadFoldersList();
      handleOpenFolder(newF);
    } catch (err: any) {
      alert("Failed to create folder: " + (err.message || "Unknown error"));
    }
  }

  // Handle Edit Folder
  async function handleEditFolderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeFolder || !folderName.trim()) return;
    try {
      await updateFolder(activeFolder.id, {
        name: folderName.trim(),
        description: folderDesc.trim() || undefined
      });
      setEditFolderModal(false);
      const updated = await getFolderDetails(activeFolder.id);
      setActiveFolder(updated);
      await loadFoldersList();
    } catch (err: any) {
      alert("Failed to update folder: " + (err.message || "Unknown error"));
    }
  }

  // Handle Delete Folder
  async function handleDeleteFolderSubmit() {
    if (!activeFolder) return;
    try {
      await deleteFolder(activeFolder.id);
      setDeleteFolderModal(false);
      setActiveFolder(null);
      await loadFoldersList();
    } catch (err: any) {
      alert("Failed to delete folder: " + (err.message || "Unknown error"));
    }
  }

  // Handle Add Member
  async function handleAddMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeFolder || !memberName.trim()) return;
    try {
      await addFolderMember(activeFolder.id, {
        name: memberName.trim(),
        relationship_label: memberRelation,
        age: memberAge ? parseInt(memberAge) : null,
        gender: memberGender,
        blood_group: memberBlood,
        phone: memberPhone.trim() || null,
        email: memberEmail.trim() || null,
        notes: memberNotes.trim() || null
      });
      setAddMemberModal(false);
      setMemberName("");
      setMemberAge("");
      setMemberPhone("");
      setMemberEmail("");
      setMemberNotes("");
      const updated = await getFolderDetails(activeFolder.id);
      setActiveFolder(updated);
    } catch (err: any) {
      alert("Failed to add member: " + (err.message || "Unknown error"));
    }
  }

  // Handle Update Member
  async function handleUpdateMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeFolder || !editMemberModal || !memberName.trim()) return;
    try {
      await updateFolderMember(activeFolder.id, editMemberModal.id, {
        name: memberName.trim(),
        relationship_label: memberRelation,
        age: memberAge ? parseInt(memberAge) : null,
        gender: memberGender,
        blood_group: memberBlood,
        phone: memberPhone.trim() || null,
        email: memberEmail.trim() || null,
        notes: memberNotes.trim() || null
      });
      setEditMemberModal(null);
      const updated = await getFolderDetails(activeFolder.id);
      setActiveFolder(updated);
    } catch (err: any) {
      alert("Failed to update member: " + (err.message || "Unknown error"));
    }
  }

  // Handle Remove Member
  async function handleRemoveMember(memberId: number, memberNameStr: string) {
    if (!activeFolder) return;
    if (!confirm(`Are you sure you want to remove ${memberNameStr} and all associated reports from this folder?`)) {
      return;
    }
    try {
      await removeFolderMember(activeFolder.id, memberId);
      const updated = await getFolderDetails(activeFolder.id);
      setActiveFolder(updated);
      if (selectedMemberFilter === memberId) setSelectedMemberFilter(null);
    } catch (err: any) {
      alert("Failed to remove member: " + (err.message || "Unknown error"));
    }
  }

  // Handle Upload Report
  async function handleUploadReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeFolder || !reportFile || !reportTitle.trim() || !reportMemberId) {
      alert("Please select a file, enter a title, and assign a member.");
      return;
    }

    setUploadProgress(true);
    const formData = new FormData();
    formData.append("file", reportFile);
    formData.append("member_id", reportMemberId.toString());
    formData.append("title", reportTitle.trim());
    formData.append("document_type", reportDocType);
    if (reportDate) formData.append("report_date", reportDate);
    if (reportNotes) formData.append("notes", reportNotes.trim());

    try {
      await uploadMemberReportApi(activeFolder.id, formData);
      confetti({ particleCount: 60, spread: 60 });
      setUploadReportModal(false);
      setReportFile(null);
      setReportTitle("");
      setReportNotes("");
      setReportDate("");
      await loadActiveFolderReports(activeFolder.id);
      const updated = await getFolderDetails(activeFolder.id);
      setActiveFolder(updated);
    } catch (err: any) {
      alert("Report upload failed: " + (err.message || "Check file type or permissions"));
    } finally {
      setUploadProgress(false);
    }
  }

  // Protected Action Gate (checks if folder access verification is required)
  function requireVerifiedAccess(action: () => void) {
    if (!securityStatus?.has_password || isUnlocked) {
      action();
      return;
    }
    setPendingActionAfterUnlock(() => action);
    setVerifyError(null);
    setVerifyAccessModal(true);
  }

  // Handle Password Verification
  async function handleVerifyPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyPasswordInput) return;
    setVerifyError(null);
    try {
      await verifyFolderPassword(verifyPasswordInput);
      setVerifyPasswordInput("");
      setVerifyAccessModal(false);
      setIsUnlocked(true);
      confetti({ particleCount: 40, spread: 45 });
      await loadSecurityStatus();
      if (pendingActionAfterUnlock) {
        pendingActionAfterUnlock();
        setPendingActionAfterUnlock(null);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Invalid report-access password.");
      loadSecurityStatus();
    }
  }

  // Handle OTP Request
  async function handleRequestOTP() {
    setIsRequestingOtp(true);
    setVerifyError(null);
    try {
      const res = await requestFolderOTP(otpChannel);
      setOtpRequested(true);
      setOtpMaskedTarget(res.masked_target);
      setOtpDevCode(res.dev_code || null);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to request OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  }

  // Handle OTP Verification
  async function handleVerifyOTPSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpInput) return;
    setVerifyError(null);
    try {
      await verifyFolderOTP(otpInput);
      setOtpInput("");
      setOtpRequested(false);
      setVerifyAccessModal(false);
      setIsUnlocked(true);
      confetti({ particleCount: 40, spread: 45 });
      await loadSecurityStatus();
      if (pendingActionAfterUnlock) {
        pendingActionAfterUnlock();
        setPendingActionAfterUnlock(null);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Invalid verification code.");
    }
  }

  // Handle Session Revoke (Manual Re-lock)
  async function handleRevokeSession() {
    try {
      await revokeFolderSession();
      setIsUnlocked(false);
      await loadSecurityStatus();
      setActionSuccessNotice("Protected folder session revoked. All reports are securely locked.");
      setTimeout(() => setActionSuccessNotice(null), 4000);
    } catch (err: any) {
      alert("Failed to lock folder: " + (err.message || "Unknown error"));
    }
  }

  // Handle Security Settings: Set Password
  async function handleSetupPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (setupPasswordInput !== setupConfirmInput) {
      alert("Passwords do not match.");
      return;
    }
    if (setupPasswordInput.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    try {
      await setupReportAccessPassword(setupPasswordInput, setupConfirmInput);
      setSetupPasswordInput("");
      setSetupConfirmInput("");
      await loadSecurityStatus();
      alert("Report-access password configured with Argon2id encryption.");
    } catch (err: any) {
      alert("Failed to set password: " + (err.message || "Unknown error"));
    }
  }

  // Handle Security Settings: Change Password
  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPasswordInput !== newConfirmInput) {
      alert("New passwords do not match.");
      return;
    }
    try {
      await changeReportAccessPassword(currentPasswordInput, newPasswordInput, newConfirmInput);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setNewConfirmInput("");
      await loadSecurityStatus();
      alert("Report-access password updated successfully.");
    } catch (err: any) {
      alert("Failed to change password: " + (err.message || "Unknown error"));
    }
  }

  // Handle Security Settings: Update Allowed Methods & Contacts
  async function handleSaveSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateFolderSecuritySettings({
        allowed_access_methods: allowedMethodsInput,
        verified_email: verifiedEmailInput.trim() || undefined,
        verified_phone: verifiedPhoneInput.trim() || undefined
      });
      await loadSecurityStatus();
      alert("Security configuration saved.");
    } catch (err: any) {
      alert("Failed to save settings: " + (err.message || "Unknown error"));
    }
  }

  // Open Audit Logs Modal
  async function handleOpenAuditLogs() {
    setLoadingAuditLogs(true);
    setAuditLogsModal(true);
    try {
      const logs = await getFolderAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      console.warn("Failed to load audit logs:", err);
    } finally {
      setLoadingAuditLogs(false);
    }
  }

  // Filtered folder list
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(folderSearch.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(folderSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ==================== GLOBAL SECURITY STATUS HEADER ==================== */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200 uppercase tracking-wide flex items-center gap-1">
              <FolderLock className="w-3 h-3 text-cyan-700" /> Member Health Folders
            </span>
            {securityStatus?.has_password ? (
              isUnlocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Unlocked (15m Session)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Protected with Argon2id / OTP
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Standard Auth
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Patient & Family Medical Archive</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Organize lab reports, scans, and prescriptions into isolated member folders. Guarded by verified ownership, OTP verification, and Argon2id encryption.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isUnlocked && (
            <button
              onClick={handleRevokeSession}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Lock folder immediately"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Lock Now</span>
            </button>
          )}

          <button
            onClick={() => setSecuritySettingsModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Security Settings</span>
          </button>

          <button
            onClick={handleOpenAuditLogs}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>Access History</span>
          </button>

          <button
            onClick={() => {
              setFolderName("");
              setFolderDesc("");
              setCreateFolderModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* ==================== WORKSPACE: FOLDER LIST vs ACTIVE FOLDER ==================== */}
      {!activeFolder ? (
        /* --- FOLDERS OVERVIEW GRID --- */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search health folders..."
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredFolders.length}</strong> folder(s)
            </span>
          </div>

          {loadingFolders ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
              <span>Loading secure folders...</span>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Health Folders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a folder (e.g. "Family Records", "Cardiac Health", or "Pediatric Care") to store medical reports for family members.
              </p>
              <button
                onClick={() => setCreateFolderModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Folder</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFolders.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleOpenFolder(f)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 group-hover:bg-cyan-100 text-cyan-700 flex items-center justify-center transition-colors">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Owner: You
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {f.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {f.description || "Secure patient folder for diagnostic records."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {f.member_count} {f.member_count === 1 ? "Member" : "Members"}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {f.report_count} {f.report_count === 1 ? "Report" : "Reports"}
                      </span>
                    </div>
                    <span className="text-cyan-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Open <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* --- ACTIVE FOLDER DETAIL VIEW --- */
        <div className="space-y-6">
          {/* Top Bar inside Folder */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveFolder(null)}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Folders</span>
              </button>
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>{activeFolder.name}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Created {new Date(activeFolder.created_at).toLocaleDateString()} • {activeFolder.description || "Protected health vault"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFolderName(activeFolder.name);
                  setFolderDesc(activeFolder.description || "");
                  setEditFolderModal(true);
                }}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                title="Rename folder"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setDeleteFolderModal(true)}
                className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                title="Delete folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setMemberName("");
                  setMemberRelation("Self");
                  setMemberAge("");
                  setMemberPhone("");
                  setMemberEmail("");
                  setMemberNotes("");
                  setAddMemberModal(true);
                }}
                className="px-3 py-2 rounded-xl border border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-700" />
                <span>Add Member</span>
              </button>

              <button
                onClick={() => {
                  setReportFile(null);
                  setReportTitle("");
                  setReportNotes("");
                  setReportDate(new Date().toISOString().split("T")[0]);
                  setReportMemberId(activeFolder.members?.[0]?.id || "");
                  setUploadReportModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Report</span>
              </button>
            </div>
          </div>

          {/* --- SECTION 1: MEMBERS CARDS --- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                Folder Members ({activeFolder.members?.length || 0})
              </span>
              <span className="text-[11px] text-slate-500">
                Click a member to filter their individual reports
              </span>
            </div>

            {(!activeFolder.members || activeFolder.members.length === 0) ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                No members in this folder yet. Click <strong>Add Member</strong> to create patient cards (e.g. Self, Spouse, Child).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* "All Members" Filter Pill */}
                <div
                  onClick={() => setSelectedMemberFilter(null)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMemberFilter === null
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      selectedMemberFilter === null ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      ALL
                    </div>
                    <div>
                      <span className="text-xs font-bold block">All Folder Reports</span>
                      <span className={`text-[10px] ${selectedMemberFilter === null ? "text-cyan-100" : "text-slate-500"}`}>
                        {reports.length} total reports
                      </span>
                    </div>
                  </div>
                </div>

                {activeFolder.members.map((m: any) => {
                  const isSelected = selectedMemberFilter === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberFilter(isSelected ? null : m.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? "bg-cyan-50 border-cyan-500 shadow-xs ring-1 ring-cyan-500"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-cyan-800 font-semibold">
                              {m.relationship_label || "Self"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setMemberName(m.name);
                              setMemberRelation(m.relationship_label || "Self");
                              setMemberAge(m.age ? m.age.toString() : "");
                              setMemberGender(m.gender || "Female");
                              setMemberBlood(m.blood_group || "Unknown");
                              setMemberPhone(m.phone || "");
                              setMemberEmail(m.email || "");
                              setMemberNotes(m.notes || "");
                              setEditMemberModal(m);
                            }}
                            className="p-1 text-slate-400 hover:text-cyan-700 rounded"
                            title="Edit Member"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.id, m.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        {m.age && <span>{m.age} yrs</span>}
                        {m.blood_group && m.blood_group !== "Unknown" && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            {m.blood_group}
                          </span>
                        )}
                        <span className="ml-auto font-semibold text-slate-700">
                          {m.report_count || 0} reports
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- SECTION 2: MEDICAL REPORTS TABLE / GRID --- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search reports by title or notes..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Doc Type Selector */}
                <select
                  value={selectedDocTypeFilter}
                  onChange={(e) => setSelectedDocTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-500"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt === "All" ? "All Document Types" : dt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                {selectedMemberFilter && (
                  <button
                    onClick={() => setSelectedMemberFilter(null)}
                    className="text-[11px] text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Clear member filter <X className="w-3 h-3" />
                  </button>
                )}
                <span>
                  Showing <strong>{reports.length}</strong> report(s)
                </span>
              </div>
            </div>

            {loadingReports ? (
              <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
                <span>Loading reports...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Medical Reports In This View</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Upload PDF lab investigations, handwritten prescription photos, or radiology scan reports into this member folder.
                </p>
                <button
                  onClick={() => {
                    setReportFile(null);
                    setReportTitle("");
                    setReportNotes("");
                    setReportDate(new Date().toISOString().split("T")[0]);
                    setReportMemberId(activeFolder.members?.[0]?.id || "");
                    setUploadReportModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs mt-2"
                >
                  <Upload className="w-3 h-3" /> Upload Report
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-bold">Document Title</th>
                      <th className="pb-3 font-bold">Member</th>
                      <th className="pb-3 font-bold">Category</th>
                      <th className="pb-3 font-bold">Report Date</th>
                      <th className="pb-3 font-bold">File Format</th>
                      <th className="pb-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 pr-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                              {r.mime_type?.includes("pdf") ? (
                                <FileText className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <FileImage className="w-3.5 h-3.5 text-cyan-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold block text-slate-800">{r.title}</span>
                              <span className="text-[10px] text-slate-400 block">{r.file_name}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-3">
                          <span className="font-semibold text-slate-800 block">{r.member_name}</span>
                          {r.member_relationship && (
                            <span className="text-[10px] text-slate-500 font-medium">{r.member_relationship}</span>
                          )}
                        </td>

                        <td className="py-3 pr-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {r.document_type}
                          </span>
                        </td>

                        <td className="py-3 pr-3 text-slate-600 text-[11px] font-medium">
                          {r.report_date || "N/A"}
                        </td>

                        <td className="py-3 pr-3 text-slate-500 text-[11px]">
                          {(r.file_size / 1024).toFixed(0)} KB • {r.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
                        </td>

                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                requireVerifiedAccess(() => setPreviewReportModal(r));
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                              title="Preview document"
                            >
                              <Eye className="w-3 h-3 text-cyan-600" />
                              <span>Preview</span>
                            </button>

                            <button
                              onClick={() => {
                                requireVerifiedAccess(() => {
                                  window.open(getReportDownloadUrl(activeFolder.id, r.id), "_blank");
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                              title="Download document"
                            >
                              <Download className="w-3 h-3 text-slate-500" />
                              <span>Download</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!confirm(`Delete report '${r.title}'? This action cannot be undone.`)) return;
                                try {
                                  await deleteMemberReport(activeFolder.id, r.id);
                                  await loadActiveFolderReports(activeFolder.id);
                                } catch (err: any) {
                                  alert("Failed to delete report: " + (err.message || "Unknown error"));
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS SECTION
          ========================================================================= */}

      {/* MODAL 1: CREATE FOLDER */}
      {createFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-600" />
                <span>Create New Health Folder</span>
              </h3>
              <button onClick={() => setCreateFolderModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Folder Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Reddy Family Archive, Cardiology Scans"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Briefly describe the contents of this medical folder..."
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateFolderModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FOLDER */}
      {editFolderModal && activeFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-600" />
                <span>Rename Health Folder</span>
              </h3>
              <button onClick={() => setEditFolderModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditFolderSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Folder Name *</label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditFolderModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE FOLDER CONFIRMATION */}
      {deleteFolderModal && activeFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Folder '{activeFolder.name}'?</h3>
              <p className="text-xs text-slate-500">
                This will permanently delete this folder, all member profiles inside it, and purge all private medical documents from storage.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteFolderModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFolderSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD MEMBER */}
      {addMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-600" />
                <span>Add Member to '{activeFolder?.name}'</span>
              </h3>
              <button onClick={() => setAddMemberModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. D. Srujana Reddy"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                  <select
                    value={memberRelation}
                    onChange={(e) => setMemberRelation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 31"
                    value={memberAge}
                    onChange={(e) => setMemberAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={memberGender}
                    onChange={(e) => setMemberGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={memberBlood}
                    onChange={(e) => setMemberBlood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. member@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Medical Notes & Allergies</label>
                <textarea
                  placeholder="e.g. Seasonal asthma, penicillin allergy, chronic hypertension..."
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMemberModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
                >
                  Add Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT MEMBER */}
      {editMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-600" />
                <span>Edit Profile for {editMemberModal.name}</span>
              </h3>
              <button onClick={() => setEditMemberModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMemberSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                  <select
                    value={memberRelation}
                    onChange={(e) => setMemberRelation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={memberAge}
                    onChange={(e) => setMemberAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={memberGender}
                    onChange={(e) => setMemberGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={memberBlood}
                    onChange={(e) => setMemberBlood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Notes</label>
                <textarea
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditMemberModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: UPLOAD REPORT */}
      {uploadReportModal && activeFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-600" />
                <span>Upload Medical Report</span>
              </h3>
              <button onClick={() => setUploadReportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadReportSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assign to Member *</label>
                <select
                  value={reportMemberId}
                  onChange={(e) => setReportMemberId(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                >
                  <option value="">Select Member...</option>
                  {(activeFolder.members || []).map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relationship_label || "Self"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Report Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Fasting Blood Sugar & HbA1c Lab Report"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Type</label>
                  <select
                    value={reportDocType}
                    onChange={(e) => setReportDocType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    {DOCUMENT_TYPES.filter(d => d !== "All").map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Report Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              {/* File Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select File (PDF, JPG, JPEG, PNG, max 20MB) *</label>
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/70 transition-colors text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setReportFile(f);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  {reportFile ? (
                    <div className="text-xs text-cyan-900 flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-600" />
                      <span className="font-bold">{reportFile.name}</span>
                      <span className="text-slate-500">({(reportFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                      <span className="text-xs font-semibold text-slate-700 block">Click or drag document here</span>
                      <span className="text-[10px] text-slate-500 block">Encrypted in private server storage</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Notes (Optional)</label>
                <textarea
                  placeholder="Doctor instructions, findings, or lab remarks..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadReportModal(false)}
                  disabled={uploadProgress}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  {uploadProgress ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Encrypting & Uploading...</span>
                    </>
                  ) : (
                    <span>Upload & Save Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: SECURE ACCESS VERIFICATION (OTP or Password) */}
      {verifyAccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-cyan-500">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Protected Access Verification</h3>
                  <p className="text-[11px] text-slate-500">
                    Verify your identity to unlock protected reports
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setVerifyAccessModal(false);
                  setPendingActionAfterUnlock(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Method Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setVerifyTab("password");
                  setVerifyError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  verifyTab === "password"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Report Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyTab("otp");
                  setVerifyError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  verifyTab === "otp"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                One-Time Code (OTP)
              </button>
            </div>

            {verifyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {/* TAB A: PASSWORD VERIFICATION */}
            {verifyTab === "password" && (
              <form onSubmit={handleVerifyPasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Enter Report-Access Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={verifyPasswordInput}
                    onChange={(e) => setVerifyPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 font-mono"
                    autoFocus
                    required
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Protected by Argon2id memory-hard key derivation. Max 5 attempts before lockout.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyAccessModal(false);
                      setPendingActionAfterUnlock(null);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Folder</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB B: OTP VERIFICATION */}
            {verifyTab === "otp" && (
              <div className="space-y-4">
                {!otpRequested ? (
                  <div className="space-y-3.5">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We will deliver a 6-digit cryptographic security code to the verified contact details on your account.
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="otpChannel"
                          value="email"
                          checked={otpChannel === "email"}
                          onChange={() => setOtpChannel("email")}
                        />
                        <span>Email Address</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="otpChannel"
                          value="phone"
                          checked={otpChannel === "phone"}
                          onChange={() => setOtpChannel("phone")}
                        />
                        <span>Mobile Phone (SMS)</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={isRequestingOtp}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                    >
                      {isRequestingOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Code...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send One-Time Code</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOTPSubmit} className="space-y-3.5">
                    <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs space-y-1">
                      <span className="font-bold block">One-time code dispatched</span>
                      <span className="text-[11px] text-cyan-800 block">
                        Code sent to <strong>{otpMaskedTarget}</strong> (expires in 10 minutes).
                      </span>
                      {otpDevCode && (
                        <div className="mt-1.5 p-1.5 rounded bg-amber-100 border border-amber-300 text-amber-950 font-mono text-[11px]">
                          <strong>Dev Test Code:</strong> {otpDevCode}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Enter 6-Digit Code
                      </label>
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:border-cyan-600 font-bold"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpRequested(false)}
                        className="text-[11px] text-cyan-700 hover:underline font-semibold"
                      >
                        Resend Code
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyAccessModal(false);
                            setPendingActionAfterUnlock(null);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          Verify & Unlock
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 8: SECURITY SETTINGS */}
      {securitySettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-600" />
                <span>Folder Security & Protection Settings</span>
              </h3>
              <button onClick={() => setSecuritySettingsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Report-Access Password Section */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-700" />
                {securityStatus?.has_password ? "Change Report-Access Password" : "Set Report-Access Password"}
              </span>

              {securityStatus?.has_password ? (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Current Password</label>
                    <input
                      type="password"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-0.5">New Password</label>
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-0.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={newConfirmInput}
                        onChange={(e) => setNewConfirmInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs"
                  >
                    Update Password
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSetupPasswordSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-0.5">Create Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        value={setupPasswordInput}
                        onChange={(e) => setSetupPasswordInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-0.5">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Repeat password"
                        value={setupConfirmInput}
                        onChange={(e) => setSetupConfirmInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Save Argon2id Password
                  </button>
                </form>
              )}
            </div>

            {/* Allowed Access Methods & Verified Contacts */}
            <form onSubmit={handleSaveSettingsSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Allowed Report-Access Verification</label>
                <select
                  value={allowedMethodsInput}
                  onChange={(e) => setAllowedMethodsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900"
                >
                  <option value="both">Both (Password or One-Time Code OTP)</option>
                  <option value="password_only">Password Only (Strict)</option>
                  <option value="otp_only">One-Time Code (OTP) Only</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Verified Security Email</label>
                  <input
                    type="email"
                    value={verifiedEmailInput}
                    onChange={(e) => setVerifiedEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Verified Security Phone</label>
                  <input
                    type="text"
                    value={verifiedPhoneInput}
                    onChange={(e) => setVerifiedPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Delivery Integration Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-cyan-600" /> Live Delivery Gateway: {securityStatus?.otp_delivery_provider}
                </span>
                <p>
                  {securityStatus?.otp_delivery_configured
                    ? "Live SMTP or SMS gateway credentials detected. Codes are delivered to your contact addresses."
                    : "Live gateway credentials are not yet configured in .env. Test codes are provided in local development mode without blocking registration."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSecuritySettingsModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
                >
                  Save Security Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: AUDIT LOGS */}
      {auditLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-600" />
                <span>Folder Access & Audit History</span>
              </h3>
              <button onClick={() => setAuditLogsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loadingAuditLogs ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
                  <span>Loading audit log entries...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No audit events recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "locked_out"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                          {log.method && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              via {log.method.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-700 block font-medium">{log.details || "Folder security event"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">Immutable server-side audit logs.</span>
              <button
                type="button"
                onClick={() => setAuditLogsModal(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: REPORT PREVIEW VIEWER */}
      {previewReportModal && activeFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] p-6 flex flex-col space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewReportModal.title}</h3>
                  <span className="text-[11px] text-slate-500">
                    {previewReportModal.file_name} • Member: {previewReportModal.member_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.open(getReportDownloadUrl(activeFolder.id, previewReportModal.id), "_blank");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewReportModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Preview Frame */}
            <div className="flex-1 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {previewReportModal.mime_type?.includes("pdf") ? (
                <iframe
                  src={getReportPreviewUrl(activeFolder.id, previewReportModal.id)}
                  className="w-full h-full border-0"
                  title={previewReportModal.title}
                />
              ) : (
                <img
                  src={getReportPreviewUrl(activeFolder.id, previewReportModal.id)}
                  alt={previewReportModal.title}
                  className="max-h-full max-w-full object-contain p-2"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
