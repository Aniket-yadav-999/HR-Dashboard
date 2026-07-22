import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

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
