/**
 * ═══════════════════════════════════════════════════════════════
 *  API Service — HTTP client for the backend
 *  All endpoints typed — no `any` types
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  AuthResponse,
  Badge,
  CheckinData,
  CheckinResult,
  Consent,
  Content,
  Event,
  InviteCreate,
  InviteTracking,
  Invitation,
  LeaderboardEntry,
  Level,
  Mission,
  MissionCategory,
  MissionSubmitResult,
  Notification,
  PaginatedResponse,
  PointTransaction,
  Region,
  RegisterData,
  ShareResult,
  UnreadCount,
  User,
  UserMission,
  UserRank,
  UserStats,
} from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;
    const authToken = token || this.token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ═══ AUTH ═══
  async register(data: RegisterData) {
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ access_token: string; refresh_token: string }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  // ═══ USERS ═══
  async getMyProfile() {
    return this.request<User>('/api/v1/users/me');
  }

  async updateProfile(data: Partial<User>) {
    return this.request<User>('/api/v1/users/me', { method: 'PATCH', body: data });
  }

  async getLevels() {
    return this.request<Level[]>('/api/v1/users/levels/all');
  }

  async getRegions() {
    return this.request<Region[]>('/api/v1/users/regions/all');
  }

  async generateReferralCode() {
    return this.request<{ referral_code: string }>('/api/v1/users/me/referral-code', { method: 'POST' });
  }

  // ═══ CONSENTS (LGPD §8.1) ═══
  async getMyConsents() {
    return this.request<Consent[]>('/api/v1/users/me/consents');
  }

  async grantConsent(consent_type: string, accepted: boolean) {
    return this.request<Consent>('/api/v1/users/me/consents', {
      method: 'POST',
      body: { consent_type, accepted },
    });
  }

  async revokeConsent(consentType: string) {
    return this.request<{ message: string }>(`/api/v1/users/me/consents/${consentType}`, {
      method: 'DELETE',
    });
  }

  // ═══ DELETE ACCOUNT (LGPD §8.1) ═══
  async deleteAccount() {
    return this.request<{ message: string }>('/api/v1/users/me/account', {
      method: 'DELETE',
    });
  }

  // ═══ GAMIFICATION ═══
  async getMyStats() {
    return this.request<UserStats>('/api/v1/gamification/my-stats');
  }

  async getLeaderboard(limit = 50, regionId?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (regionId) params.set('region_id', regionId);
    return this.request<LeaderboardEntry[]>(`/api/v1/gamification/leaderboard?${params}`);
  }

  async getMyRank() {
    return this.request<UserRank>('/api/v1/gamification/my-rank');
  }

  async getPointsHistory(limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.request<PointTransaction[]>(`/api/v1/gamification/points-history?${params}`);
  }

  // ═══ MISSIONS ═══
  async getMissions(page = 1, categoryId?: string, featured?: boolean) {
    const params = new URLSearchParams({ page: page.toString() });
    if (categoryId) params.set('category_id', categoryId);
    if (featured !== undefined) params.set('is_featured', featured.toString());
    return this.request<PaginatedResponse<Mission>>(`/api/v1/missions?${params}`);
  }

  async getMission(id: string) {
    return this.request<Mission>(`/api/v1/missions/${id}`);
  }

  async getMyMissions() {
    return this.request<UserMission[]>('/api/v1/missions/my-missions');
  }

  async startMission(id: string) {
    return this.request<UserMission>(`/api/v1/missions/${id}/start`, { method: 'POST' });
  }

  async submitMission(id: string, evidenceUrl?: string) {
    return this.request<MissionSubmitResult>(`/api/v1/missions/${id}/submit`, {
      method: 'POST',
      body: { evidence_url: evidenceUrl },
    });
  }

  async getMissionCategories() {
    return this.request<MissionCategory[]>('/api/v1/missions/categories');
  }

  // ═══ EVENTS ═══
  async getEvents(page = 1, eventType?: string, regionId?: string) {
    const params = new URLSearchParams({ page: page.toString() });
    if (eventType) params.set('event_type', eventType);
    if (regionId) params.set('region_id', regionId);
    return this.request<PaginatedResponse<Event>>(`/api/v1/events?${params}`);
  }

  async getEvent(id: string) {
    return this.request<Event>(`/api/v1/events/${id}`);
  }

  async registerForEvent(id: string) {
    return this.request<{ message: string; participant_id: string }>(`/api/v1/events/${id}/register`, { method: 'POST' });
  }

  async checkinEvent(id: string, data: CheckinData) {
    return this.request<CheckinResult>(`/api/v1/events/${id}/checkin`, {
      method: 'POST',
      body: data,
    });
  }

  // ═══ CONTENT ═══
  async getContent(page = 1, contentType?: string) {
    const params = new URLSearchParams({ page: page.toString() });
    if (contentType) params.set('content_type', contentType);
    return this.request<PaginatedResponse<Content>>(`/api/v1/content?${params}`);
  }

  async getContentById(id: string) {
    return this.request<Content>(`/api/v1/content/${id}`);
  }

  async shareContent(id: string, platform = 'whatsapp') {
    return this.request<ShareResult>(`/api/v1/content/${id}/share?platform=${platform}`, { method: 'POST' });
  }

  // ═══ INVITATIONS ═══
  async createInvitation(data: InviteCreate) {
    return this.request<Invitation>('/api/v1/invitations', {
      method: 'POST',
      body: data,
    });
  }

  async getMyInvitations() {
    return this.request<InviteTracking>('/api/v1/invitations/my');
  }

  async validateInvitation(inviteCode: string) {
    return this.request<{ message: string }>(`/api/v1/invitations/${inviteCode}/validate`, {
      method: 'POST',
    });
  }

  // ═══ NOTIFICATIONS ═══
  async getNotifications(unreadOnly = false) {
    return this.request<Notification[]>(`/api/v1/notifications?unread_only=${unreadOnly}`);
  }

  async getUnreadCount() {
    return this.request<UnreadCount>('/api/v1/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request<Notification>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/api/v1/notifications/read-all', { method: 'PATCH' });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
