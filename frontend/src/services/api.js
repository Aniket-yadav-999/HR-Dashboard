import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const directBackendBaseUrl = (import.meta.env.VITE_DIRECT_API_URL || "https://hr-dashboard-ynkt.onrender.com/api").replace(/\/$/, "");
const reimbursementBaseUrl = import.meta.env.PROD ? `${directBackendBaseUrl}/hr-operations/reimbursements` : "/hr-operations/reimbursements";

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("a2g_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function requestLogin(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data;
}

export async function verifyOtp(payload) {
  const response = await api.post("/auth/verify-otp", payload);
  return response.data;
}

export async function resendOtp(payload) {
  const response = await api.post("/auth/resend-otp", payload);
  return response.data;
}

export async function requestPasswordReset(payload) {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
}

export async function resetPassword(payload) {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function getProfile() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function getOverviewUsers() {
  const response = await api.get("/users/overview");
  return response.data;
}

export async function createUser(payload) {
  const response = await api.post("/users", payload);
  return response.data;
}

export async function updateUser(id, payload) {
  const response = await api.put(`/users/${id}`, payload);
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

export async function createAttendance(payload) {
  const response = await api.post("/attendance", payload);
  return response.data;
}

export async function getAttendance() {
  const response = await api.get("/attendance");
  return response.data;
}

export async function updateAttendanceStatus(id, payload) {
  const response = await api.patch(`/attendance/${id}/status`, payload);
  return response.data;
}

export async function getHolidays() {
  const response = await api.get("/holidays");
  return response.data;
}

export async function createHoliday(payload) {
  const response = await api.post("/holidays", payload);
  return response.data;
}

export async function updateHoliday(id, payload) {
  const response = await api.put(`/holidays/${id}`, payload);
  return response.data;
}

export async function deleteHoliday(id) {
  const response = await api.delete(`/holidays/${id}`);
  return response.data;
}

export async function getEngagementItems() {
  const response = await api.get("/engagement");
  return response.data;
}

export async function getEngagementPeople() {
  const response = await api.get("/engagement/people");
  return response.data;
}

export async function createEngagementItem(payload) {
  const response = await api.post("/engagement", payload);
  return response.data;
}

export async function updateEngagementItem(id, payload) {
  const response = await api.put(`/engagement/${id}`, payload);
  return response.data;
}

export async function deleteEngagementItem(id) {
  const response = await api.delete(`/engagement/${id}`);
  return response.data;
}

export async function getHelpdeskTickets() {
  const response = await api.get("/helpdesk");
  return response.data;
}

export async function createHelpdeskTicket(payload) {
  const response = await api.post("/helpdesk", payload);
  return response.data;
}

export async function updateHelpdeskTicket(id, payload) {
  const response = await api.put(`/helpdesk/${id}`, payload);
  return response.data;
}

export async function getAssets() {
  const response = await api.get("/assets");
  return response.data;
}

export async function createAsset(payload) {
  const response = await api.post("/assets", payload);
  return response.data;
}

export async function updateAsset(id, payload) {
  const response = await api.put(`/assets/${id}`, payload);
  return response.data;
}

export async function bulkReplaceAssets(assets) {
  const response = await api.post("/assets/bulk", { assets });
  return response.data;
}

export async function getNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}

export async function getHrDocuments() {
  const response = await api.get("/hr-operations/documents");
  return response.data;
}

export async function uploadHrDocument(formData) {
  const response = await api.post("/hr-operations/documents", formData);
  return response.data;
}

export async function updateHrDocument(id, formData) {
  const response = await api.patch(`/hr-operations/documents/${id}`, formData);
  return response.data;
}

export async function downloadHrDocument(id, fileName) {
  const response = await api.get(`/hr-operations/documents/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getAppraisals() {
  const response = await api.get("/hr-operations/appraisals");
  return response.data;
}

export async function getAppraisalTemplate() {
  const response = await api.get("/hr-operations/appraisal-template");
  return response.data;
}

export async function updateAppraisalTemplate(payload) {
  const response = await api.put("/hr-operations/appraisal-template", payload);
  return response.data;
}

export async function createAppraisal(payload) {
  const response = await api.post("/hr-operations/appraisals", payload);
  return response.data;
}

export async function updateAppraisal(id, payload) {
  const response = await api.patch(`/hr-operations/appraisals/${id}`, payload);
  return response.data;
}

export async function downloadAppraisalPdf(id, fileName) {
  const response = await api.get(`/hr-operations/appraisals/${id}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getReimbursements() {
  const response = await api.get("/hr-operations/reimbursements");
  return response.data;
}

export async function createReimbursement(payload) {
  const response = await api.post(reimbursementBaseUrl, payload);
  return response.data;
}

export async function updateReimbursement(id, payload) {
  const response = await api.patch(`/hr-operations/reimbursements/${id}`, payload);
  return response.data;
}

export async function downloadReimbursementProof(id, fileName) {
  const response = await api.get(`${reimbursementBaseUrl}/${id}/proof`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
