import { create } from 'zustand';
import { connectToDb, disconnectFromDb, getConnectionStatus } from '../utils/api';

const useConnectionStore = create((set) => ({
  connected: false,
  config: null,
  loading: false,
  error: null,

  connect: async (config) => {
    set({ loading: true, error: null });
    try {
      const res = await connectToDb(config);
      set({ connected: true, config, loading: false, error: null });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  disconnect: async () => {
    try {
      await disconnectFromDb();
    } catch {
      // ignore
    }
    set({ connected: false, config: null, error: null });
  },

  checkStatus: async () => {
    try {
      const res = await getConnectionStatus();
      const { connected, config } = res.data;
      set({ connected, config });
    } catch {
      set({ connected: false, config: null });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useConnectionStore;
