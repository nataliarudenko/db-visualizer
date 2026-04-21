import { create } from 'zustand';
import { getRows, createRow, updateRow, deleteRow } from '../utils/api';

const useDataStore = create((set, get) => ({
  rows: [],
  total: 0,
  page: 1,
  limit: 50,
  loading: false,
  error: null,
  search: '',

  fetchRows: async (table, page = 1, search = '') => {
    set({ loading: true, error: null, page, search });
    try {
      const res = await getRows(table, page, get().limit, search);
      set({
        rows: res.data.rows,
        total: res.data.total,
        page: res.data.page,
        loading: false,
      });
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ loading: false, error: message });
    }
  },

  addRow: async (table, data) => {
    set({ loading: true, error: null });
    try {
      await createRow(table, data);
      await get().fetchRows(table, get().page, get().search);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ loading: false, error: message });
      return false;
    }
  },

  editRow: async (table, id, data) => {
    set({ error: null });
    try {
      await updateRow(table, id, data);
      await get().fetchRows(table, get().page, get().search);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ error: message });
      return false;
    }
  },

  removeRow: async (table, id) => {
    set({ error: null });
    try {
      await deleteRow(table, id);
      await get().fetchRows(table, get().page, get().search);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ error: message });
      return false;
    }
  },

  clearData: () => set({ rows: [], total: 0, page: 1, error: null, search: '' }),
  clearError: () => set({ error: null }),
}));

export default useDataStore;
