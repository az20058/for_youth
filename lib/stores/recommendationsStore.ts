import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recommendation } from '@/lib/quiz';

interface RecommendationsState {
  recommendations: Recommendation[];
  setRecommendations: (recommendations: Recommendation[]) => void;
  clearRecommendations: () => void;
}

export const useRecommendationsStore = create<RecommendationsState>()(
  persist(
    (set) => ({
      recommendations: [],
      setRecommendations: (recommendations) => set({ recommendations }),
      clearRecommendations: () => set({ recommendations: [] }),
    }),
    { name: 'ember_recommendations' },
  ),
);
