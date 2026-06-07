/**
 * ═══════════════════════════════════════════════════════════════
 *  Mission Store — Zustand state management for missions
 *  PRD §4.2: Full state machine AVAILABLE→COMPLETED
 * ═══════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import api from '../services/api';
import type { Mission, MissionCategory, MissionSubmitResult, PaginatedResponse, UserMission, UserMissionStatus } from '../services/types';

interface MissionState {
  // Available missions (browse)
  missions: Mission[];
  categories: MissionCategory[];
  selectedCategory: string | null;
  isLoadingMissions: boolean;

  // User's missions (tracking)
  myMissions: UserMission[];
  isLoadingMyMissions: boolean;

  // Actions
  loadMissions: (page?: number, categoryId?: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadMyMissions: () => Promise<void>;
  startMission: (missionId: string) => Promise<UserMission>;
  submitMission: (missionId: string, evidenceUrl?: string) => Promise<MissionSubmitResult>;
  setSelectedCategory: (categoryId: string | null) => void;

  // Derived
  getMissionsByStatus: (status: UserMissionStatus) => UserMission[];
}

export const useMissionStore = create<MissionState>()((set, get) => ({
  missions: [],
  categories: [],
  selectedCategory: null,
  isLoadingMissions: false,
  myMissions: [],
  isLoadingMyMissions: false,

  loadMissions: async (page = 1, categoryId?: string) => {
    set({ isLoadingMissions: true });
    try {
      const data = await api.getMissions(page, categoryId);
      set({ missions: data.items || [] });
    } catch {
      // silent
    }
    set({ isLoadingMissions: false });
  },

  loadCategories: async () => {
    try {
      const cats = await api.getMissionCategories();
      set({ categories: cats || [] });
    } catch {
      // silent
    }
  },

  loadMyMissions: async () => {
    set({ isLoadingMyMissions: true });
    try {
      const data = await api.getMyMissions();
      set({ myMissions: data || [] });
    } catch {
      // silent
    }
    set({ isLoadingMyMissions: false });
  },

  startMission: async (missionId: string) => {
    // Optimistic: we'll reload after
    const result = await api.startMission(missionId);
    // Reload user missions to reflect new state
    get().loadMyMissions();
    return result;
  },

  submitMission: async (missionId: string, evidenceUrl?: string) => {
    const result = await api.submitMission(missionId, evidenceUrl);
    // Reload user missions to reflect new state
    get().loadMyMissions();
    return result;
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
  },

  getMissionsByStatus: (status: UserMissionStatus) => {
    return get().myMissions.filter((m) => m.status === status);
  },
}));
