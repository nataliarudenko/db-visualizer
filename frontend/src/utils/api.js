import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Connection
export const connectToDb = (config) => api.post('/connection/connect', config);
export const disconnectFromDb = () => api.post('/connection/disconnect');
export const getConnectionStatus = () => api.get('/connection/status');

// Introspection
export const getFullSchema = () => api.get('/introspection/full-schema');
export const getTables = () => api.get('/introspection/tables');
export const getColumns = (table) => api.get(`/introspection/columns/${table}`);
export const getForeignKeys = () => api.get('/introspection/foreign-keys');

// Data CRUD
export const getRows = (table, page = 1, limit = 50, search = '') =>
  api.get(`/data/${table}`, { params: { page, limit, search } });
export const createRow = (table, data) => api.post(`/data/${table}`, data);
export const updateRow = (table, id, data) => api.put(`/data/${table}/${id}`, data);
export const deleteRow = (table, id) => api.delete(`/data/${table}/${id}`);
export const lookupData = (table, search = '', limit = 30) =>
  api.get(`/data/${table}/lookup`, { params: { search, limit } });

// Schema
export const createForeignKey = async (data) => {
  const response = await api.post('/schema/foreign-key', data);
  return response.data;
};

export const createColumnAndForeignKey = async (data) => {
  const response = await api.post('/schema/column-and-fk', data);
  return response.data;
};

export const deleteForeignKey = async (constraintName, tableName) => {
  const response = await api.delete(`/schema/foreign-key/${encodeURIComponent(tableName)}/${encodeURIComponent(constraintName)}`);
  return response.data;
};

// Layout
export const getLayout = () => api.get('/layout');
export const saveLayout = (layoutData) => api.post('/layout', layoutData);

export default api;
