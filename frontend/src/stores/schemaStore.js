import { create } from 'zustand';
import { getFullSchema } from '../utils/api';

const useSchemaStore = create((set) => ({
  tables: [],
  foreignKeys: [],
  loading: false,
  error: null,

  fetchSchema: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getFullSchema();
      set({
        tables: res.data.tables,
        foreignKeys: res.data.foreignKeys,
        loading: false,
      });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  clearSchema: () => set({ tables: [], foreignKeys: [], error: null }),
}));

export default useSchemaStore;
