const API_BASE = "http://127.0.0.1:8000/api/v1";

// In-memory or session storage token helpers
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("mediwallet_access_token") || localStorage.getItem("mediwallet_access_token");
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("mediwallet_access_token", token);
}

export function getVaultToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("mediwallet_vault_token");
}

export function setVaultToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("mediwallet_vault_token", token);
}

export function clearVaultToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("mediwallet_vault_token");
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {})
    };

    const authToken = getAuthToken();
    if (authToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const vaultToken = getVaultToken();
    if (vaultToken && !headers["X-Vault-Token"]) {
      headers["X-Vault-Token"] = vaultToken;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      const error = new Error(err.detail || `API Error (${res.status})`);
      (error as any).status = res.status;
      (error as any).data = err;
      throw error;
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}:`, err);
    throw err;
  }
}

export async function uploadFileApi(endpoint: string, formData: FormData) {
  try {
    const headers: Record<string, string> = {};
    const authToken = getAuthToken();
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    const vaultToken = getVaultToken();
    if (vaultToken) {
      headers["X-Vault-Token"] = vaultToken;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload Error");
    }
    return await res.json();
  } catch (err) {
    console.warn(`Upload API failed for ${endpoint}:`, err);
    throw err;
  }
}

// Vault specific API helpers
export async function getVaultStatus() {
  return fetchApi("/records/vault/status");
}

export async function setupVaultPassword(password: string, confirmPassword?: string) {
  const res = await fetchApi("/records/vault/setup", {
    method: "POST",
    body: JSON.stringify({ password, confirm_password: confirmPassword })
  });
  if (res.vault_token) {
    setVaultToken(res.vault_token);
  }
  return res;
}

export async function unlockVault(password: string) {
  const res = await fetchApi("/records/vault/unlock", {
    method: "POST",
    body: JSON.stringify({ password })
  });
  if (res.vault_token) {
    setVaultToken(res.vault_token);
  }
  return res;
}

export async function lockVault() {
  try {
    await fetchApi("/records/vault/lock", { method: "POST" });
  } finally {
    clearVaultToken();
  }
  return { status: "locked" };
}

export async function renameRecord(recordId: number, data: { title: string; category?: string; doctor_name?: string; hospital_name?: string; record_date?: string }) {
  return fetchApi(`/records/${recordId}/rename`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteRecord(recordId: number) {
  return fetchApi(`/records/${recordId}`, {
    method: "DELETE"
  });
}

export function getRecordPreviewUrl(recordId: number): string {
  const vaultToken = getVaultToken();
  return `${API_BASE}/records/${recordId}/preview${vaultToken ? `?token=${encodeURIComponent(vaultToken)}` : ""}`;
}

export function getRecordDownloadUrl(recordId: number): string {
  const vaultToken = getVaultToken();
  return `${API_BASE}/records/${recordId}/download${vaultToken ? `?token=${encodeURIComponent(vaultToken)}` : ""}`;
}

// ==================== MEMBER HEALTH FOLDERS API HELPERS ====================

export function getFolderAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("mediwallet_folder_access_token");
}

export function setFolderAccessToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("mediwallet_folder_access_token", token);
}

export function clearFolderAccessToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("mediwallet_folder_access_token");
}

export async function getFolders() {
  return fetchApi("/folders");
}

export async function createFolder(data: { name: string; description?: string }) {
  return fetchApi("/folders", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getFolderDetails(folderId: number) {
  return fetchApi(`/folders/${folderId}`);
}

export async function updateFolder(folderId: number, data: { name: string; description?: string }) {
  return fetchApi(`/folders/${folderId}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteFolder(folderId: number) {
  return fetchApi(`/folders/${folderId}`, {
    method: "DELETE"
  });
}

export async function addFolderMember(folderId: number, data: any) {
  return fetchApi(`/folders/${folderId}/members`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateFolderMember(folderId: number, memberId: number, data: any) {
  return fetchApi(`/folders/${folderId}/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function removeFolderMember(folderId: number, memberId: number) {
  return fetchApi(`/folders/${folderId}/members/${memberId}`, {
    method: "DELETE"
  });
}

export async function getFolderReports(folderId: number, memberId?: number, documentType?: string, query?: string) {
  const params = new URLSearchParams();
  if (memberId) params.append("member_id", memberId.toString());
  if (documentType && documentType !== "All") params.append("document_type", documentType);
  if (query) params.append("q", query);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchApi(`/folders/${folderId}/reports${qs}`);
}

export async function uploadMemberReportApi(folderId: number, formData: FormData) {
  const folderToken = getFolderAccessToken();
  const headers: Record<string, string> = {};
  if (folderToken) {
    headers["X-Folder-Access-Token"] = folderToken;
  }
  return uploadFileApi(`/folders/${folderId}/reports`, formData);
}

export async function deleteMemberReport(folderId: number, reportId: number) {
  return fetchApi(`/folders/${folderId}/reports/${reportId}`, {
    method: "DELETE"
  });
}

export function getReportPreviewUrl(folderId: number, reportId: number): string {
  const token = getFolderAccessToken();
  return `${API_BASE}/folders/${folderId}/reports/${reportId}/preview${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export function getReportDownloadUrl(folderId: number, reportId: number): string {
  const token = getFolderAccessToken();
  return `${API_BASE}/folders/${folderId}/reports/${reportId}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export async function getFolderSecurityStatus() {
  const token = getFolderAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-Folder-Access-Token"] = token;
  }
  return fetchApi("/folders/security/status", { headers });
}

export async function setupReportAccessPassword(password: string, confirmPassword: string) {
  return fetchApi("/folders/security/setup-password", {
    method: "POST",
    body: JSON.stringify({ password, confirm_password: confirmPassword })
  });
}

export async function changeReportAccessPassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  return fetchApi("/folders/security/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  });
}

export async function updateFolderSecuritySettings(data: { allowed_access_methods?: string; verified_email?: string; verified_phone?: string }) {
  return fetchApi("/folders/security/settings", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function requestFolderOTP(channel: "email" | "phone" = "email") {
  return fetchApi("/folders/security/request-otp", {
    method: "POST",
    body: JSON.stringify({ channel })
  });
}

export async function verifyFolderOTP(otpCode: string) {
  const res = await fetchApi("/folders/security/verify-otp", {
    method: "POST",
    body: JSON.stringify({ otp_code: otpCode })
  });
  if (res.session_token) {
    setFolderAccessToken(res.session_token);
  }
  return res;
}

export async function verifyFolderPassword(password: string) {
  const res = await fetchApi("/folders/security/verify-password", {
    method: "POST",
    body: JSON.stringify({ password })
  });
  if (res.session_token) {
    setFolderAccessToken(res.session_token);
  }
  return res;
}

export async function revokeFolderSession() {
  const token = getFolderAccessToken();
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["X-Folder-Access-Token"] = token;
    }
    await fetchApi("/folders/security/revoke-session", { method: "POST", headers });
  } finally {
    clearFolderAccessToken();
  }
  return { status: "locked" };
}

export async function getFolderAuditLogs() {
  return fetchApi("/folders/security/audit-logs");
}

export async function registerApi(data: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  phone?: string;
  report_access_password?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || "Registration failed");
  }
  if (json.access_token) {
    setAuthToken(json.access_token);
  }
  return json;
}


