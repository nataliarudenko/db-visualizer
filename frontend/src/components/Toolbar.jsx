import React from 'react';

export default function Toolbar({ dbName, onSave, onRefresh, onDisconnect, onUndo, saving, message, pendingChanges, onSaveChanges }) {
  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <span className="toolbar__brand">Meta-DB Візуалізатор</span>
        {dbName && <span className="toolbar__db-name">📁 {dbName}</span>}
        <div className="toolbar__status">
          <span className="toolbar__status-dot" />
          Підключено
        </div>
      </div>

      <div className="toolbar__right">
        {message && (
          <span
            style={{
              fontSize: 12,
              color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
              marginRight: 8,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {message.text}
          </span>
        )}

        <button
          className="btn btn--secondary btn--sm"
          onClick={onRefresh}
          id="btn-refresh-schema"
          title="Оновити схему"
        >
          🔄 Оновити
        </button>

        {pendingChanges && pendingChanges.length > 0 && (
          <>
            <button
              className="btn btn--undo btn--sm"
              onClick={onUndo}
              id="btn-undo"
              title="Скасувати останню зміну"
            >
              ↩ Скасувати
            </button>

            <button
              className="btn btn--primary btn--sm"
              onClick={onSaveChanges}
              disabled={saving}
              id="btn-apply-db-changes"
              style={{ animation: 'pulse 2s infinite', background: 'var(--success)', border: 'none', boxShadow: 'none' }}
            >
              {saving ? <span className="spinner" /> : '🚀'} Зберегти зміни ({pendingChanges.length})
            </button>
          </>
        )}

        <button
          className="btn btn--secondary btn--sm"
          onClick={onSave}
          disabled={saving}
          id="btn-save-layout"
          title="Зберегти макет"
        >
          {saving ? <span className="spinner" /> : '💾'} Зберегти макет
        </button>

        <button
          className="btn btn--danger btn--sm"
          onClick={onDisconnect}
          id="btn-disconnect"
          title="Від'єднатися"
        >
          ⏏️ Від'єднатися
        </button>
      </div>
    </div>
  );
}
