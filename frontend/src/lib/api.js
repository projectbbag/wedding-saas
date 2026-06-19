import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ringv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),
  me: () => api.get("/auth/me"),
  logout: () => localStorage.removeItem("ringv_token"),
};

export const publicApi = {
  getInvitation: (slug) => api.get(`/invitations/${slug}`),
  listWishes: (slug, page = 1) => api.get(`/invitations/${slug}/wishes`, { params: { page, per_page: 6 } }),
  postWish: (slug, payload) => api.post(`/invitations/${slug}/wishes`, payload),
  postRsvp: (slug, payload) => api.post(`/invitations/${slug}/rsvp`, payload),
  trackVisit: (slug) => api.post(`/invitations/${slug}/visit`),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  // invitations
  listInvitations: () => api.get("/admin/invitations"),
  createInvitation: (data) => api.post("/admin/invitations", data),
  updateInvitation: (slug, data) => api.put(`/admin/invitations/${slug}`, data),
  deleteInvitation: (slug) => api.delete(`/admin/invitations/${slug}`),
  // stories
  listStories: (slug) => api.get(`/admin/stories${slug ? `?slug=${slug}` : ""}`),
  createStory: (data) => api.post("/admin/stories", data),
  deleteStory: (id) => api.delete(`/admin/stories/${id}`),
  // gallery
  listGallery: (slug) => api.get(`/admin/gallery${slug ? `?slug=${slug}` : ""}`),
  createGallery: (data) => api.post("/admin/gallery", data),
  deleteGallery: (id) => api.delete(`/admin/gallery/${id}`),
  // gifts
  listGifts: (slug) => api.get(`/admin/gifts${slug ? `?slug=${slug}` : ""}`),
  createGift: (data) => api.post("/admin/gifts", data),
  deleteGift: (id) => api.delete(`/admin/gifts/${id}`),
  // guests
  listGuests: (slug) => api.get(`/admin/guests${slug ? `?slug=${slug}` : ""}`),
  createGuest: (data) => api.post("/admin/guests", data),
  bulkGuests: (data) => api.post("/admin/guests/bulk", data),
  deleteGuest: (id) => api.delete(`/admin/guests/${id}`),
  checkinGuest: (id) => api.post(`/admin/guests/${id}/checkin`),
  // rsvps
  listRsvps: (slug) => api.get(`/admin/rsvps${slug ? `?slug=${slug}` : ""}`),
  deleteRsvp: (id) => api.delete(`/admin/rsvps/${id}`),
  // wishes
  listWishes: (slug) => api.get(`/admin/wishes${slug ? `?slug=${slug}` : ""}`),
  deleteWish: (id) => api.delete(`/admin/wishes/${id}`),
};
