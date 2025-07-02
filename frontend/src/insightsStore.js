import { create } from 'zustand';

export const useInsightsStore = create((set) => ({
  selectedPostId: null,
  setSelectedPostId: (id) => set({ selectedPostId: id }),
  insights: null, // will match the new JSON structure
  setInsights: (insights) => set({ insights }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  dateRange: { from: '', to: '' },
  setDateRange: (dateRange) => set({ dateRange }),
  platform: 'Instagram',
  setPlatform: (platform) => set({ platform }),
  clientId: null,
  setClientId: (clientId) => set({ clientId }),
  showPostModal: false,
  setShowPostModal: (show) => set({ showPostModal: show }),
}));

// Move any reusable business logic to core/businessLogic.js for architecture consistency.
