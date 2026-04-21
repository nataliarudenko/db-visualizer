import React, { useEffect, useState } from 'react';
import useDataStore from '../stores/dataStore';
import AutoForm from './AutoForm';

export default function DataPanel({ tableName, columns, foreignKeys, onClose }) {
  const { rows, total, page, limit, loading, error, fetchRows, removeRow, clearError, search } = useDataStore();
  const [activeTab, setActiveTab] = useState('data');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  const pkColumn = columns.find((c) => c.is_primary_key);
  const pkName = pkColumn ? pkColumn.column_name : columns[0]?.column_name;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setSearchInput('');
    fetchRows(tableName, 1, '');
    return () => useDataStore.getState().clearData();
  }, [tableName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        fetchRows(tableName, 1, searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, tableName, search]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    console.log("Delete clicked for table:", tableName, "id:", id);
    if (id === undefined || id === null) {
      alert("Помилка: не вдалося визначити ідентифікатор запису для видалення.");
      return;
    }
    if (window.confirm('Ви впевнені, що хочете видалити цей запис?')) {
      if (window.confirm('🚨 ОБЕРЕЖНО: Ця дія незворотно видалить цей запис, А ТАКОЖ усі пов\'язані записи в інших таблицях (каскадне видалення). Ви дійсно хочете продовжити?')) {
        await removeRow(tableName, id);
      }
    }
  };

  const handleEditClick = (row) => {
    setEditingRecord(row);
    setActiveTab('edit');
    clearError();
  };

  const handleInlineEdit = (rowIdx, colName, value) => {
    setEditingCell({ rowIdx, colName });
    setEditValue(value ?? '');
  };

  const handleInlineEditSave = async (row) => {
    if (!editingCell) return;
    const id = row[pkName];
    const success = await useDataStore.getState().editRow(tableName, id, {
      [editingCell.colName]: editValue,
    });
    if (success) setEditingCell(null);
  };

  const handleInlineEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleFormSuccess = () => {
    setActiveTab('data');
    setEditingRecord(null);
    fetchRows(tableName);
  };

  const displayColumns = columns.slice(0, 8);

  return (
    <div className="data-panel" id="data-panel">
      <div className="data-panel__header">
        <div>
          <div className="data-panel__title">
            📋 <span className="data-panel__table-name">{tableName}</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {total} запис{total === 1 ? '' : total < 5 ? 'и' : 'ів'}
          </span>
        </div>
        <button className="btn btn--secondary btn--icon" onClick={onClose} id="btn-close-panel">
          ✕
        </button>
      </div>

      <div className="data-panel__tabs">
        <button
          className={`data-panel__tab ${activeTab === 'data' ? 'data-panel__tab--active' : ''}`}
          onClick={() => { setActiveTab('data'); clearError(); }}
          id="tab-data"
        >
          📊 Дані
        </button>
        <button
          className={`data-panel__tab ${activeTab === 'add' ? 'data-panel__tab--active' : ''}`}
          onClick={() => { setActiveTab('add'); clearError(); setEditingRecord(null); }}
          id="tab-add"
        >
          ➕ Додати запис
        </button>
        {activeTab === 'edit' && (
          <button className="data-panel__tab data-panel__tab--active" id="tab-edit">
            ✏️ Редагувати запис
          </button>
        )}
      </div>

      <div className="data-panel__content">
        {error && <div className="error-message">{error}</div>}

        {activeTab === 'data' && (
          <>
            <div className="data-panel__search" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Пошук..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            {loading && rows.length === 0 ? (
              <div className="loading-overlay">
                <span className="spinner" />
                <span>Завантаження даних...</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📭</div>
                <div className="empty-state__text">Записів не знайдено</div>
              </div>
            ) : (
              <>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {displayColumns.map((col) => (
                          <th key={col.column_name}>{col.column_name}</th>
                        ))}
                        <th>Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {displayColumns.map((col) => {
                            const isEditing =
                              editingCell?.rowIdx === rowIdx &&
                              editingCell?.colName === col.column_name;
                            const value = row[col.column_name];
                            const displayValue =
                              value === null
                                ? 'NULL'
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value);

                            return (
                              <td
                                key={col.column_name}
                                className={col.is_primary_key ? '' : 'editable'}
                                onDoubleClick={() =>
                                  !col.is_primary_key &&
                                  handleInlineEdit(rowIdx, col.column_name, value)
                                }
                              >
                                {isEditing ? (
                                  <input
                                    className="data-table__edit-input"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleInlineEditSave(row);
                                      if (e.key === 'Escape') handleInlineEditCancel();
                                    }}
                                    onBlur={() => handleInlineEditSave(row)}
                                    autoFocus
                                  />
                                ) : (
                                  <span style={{ opacity: value === null ? 0.4 : 1 }}>
                                    {displayValue}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td>
                            <div className="data-table__actions" style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn btn--secondary btn--sm"
                                onClick={() => handleEditClick(row)}
                                title="Редагувати"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={(e) => handleDelete(e, row[pkName])}
                                title="Видалити"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <span className="pagination__info">
                      Сторінка {page} з {totalPages} ({total} всього)
                    </span>
                    <div className="pagination__controls">
                      <button
                        className="btn btn--secondary btn--sm"
                        disabled={page <= 1}
                        onClick={() => fetchRows(tableName, page - 1)}
                      >
                        ← Назад
                      </button>
                      <button
                        className="btn btn--secondary btn--sm"
                        disabled={page >= totalPages}
                        onClick={() => fetchRows(tableName, page + 1)}
                      >
                        Далі →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {(activeTab === 'add' || activeTab === 'edit') && (
          <AutoForm
            tableName={tableName}
            columns={columns}
            foreignKeys={foreignKeys}
            onSuccess={handleFormSuccess}
            initialData={editingRecord}
            isEdit={activeTab === 'edit'}
          />
        )}
      </div>
    </div>
  );
}
