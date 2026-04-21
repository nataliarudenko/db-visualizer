import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { formatType } from '../utils/typeMapper';
import useCanvasStore from '../stores/canvasStore';

function TableNode({ data, selected }) {
  const { tableName, columns, foreignKeys, isDeleted } = data;
  const selectTable = useCanvasStore((s) => s.selectTable);
  const activeHandle = useCanvasStore((s) => s.activeHandle);

  const fkSourceColumns = new Set(
    foreignKeys.filter((fk) => fk.source_table === tableName).map((fk) => fk.source_column),
  );

  return (
    <div className={`table-node ${selected ? 'table-node--selected' : ''} ${isDeleted ? 'table-node--deleted' : ''}`}>
      {isDeleted && <div className="table-node__deleted-badge">🗑 Видалено</div>}
      <div className="table-node__header">
        <span className="table-node__name">{tableName}</span>
        <span className="table-node__count">{columns.length} стовп.</span>
      </div>

      <div className="table-node__columns">
        {columns.map((col) => {
          const isPk = col.is_primary_key;
          const isFkSource = fkSourceColumns.has(col.column_name);
          const onHandleClick = (e, type) => {
            e.stopPropagation();
            if (isDeleted) return;
            const conn = useCanvasStore.getState().handleHandleClick({
              nodeId: tableName,
              handleId: `${tableName}-${col.column_name}-${type}`,
              type
            });
            if (conn) useCanvasStore.setState({ pendingConnection: conn });
          };
          const tId = `${tableName}-${col.column_name}-target`;
          const sId = `${tableName}-${col.column_name}-source`;

          return (
            <div key={col.column_name} className="table-node__column" style={{ position: 'relative' }}>
              <Handle type="target" position={Position.Left} id={tId}
                onClick={(e) => onHandleClick(e, 'target')}
                className={`custom-new-handle ${activeHandle === tId ? 'active-handle' : ''}`}
                style={{ position: 'absolute', width: '16px', height: '16px', left: '2px', borderRadius: '50%', background: '#1a1f35', border: `2px solid ${activeHandle === tId ? '#34d399' : '#6366f1'}`, zIndex: 10, cursor: 'pointer' }}
              />
              <Handle type="source" position={Position.Right} id={sId}
                onClick={(e) => onHandleClick(e, 'source')}
                className={`custom-new-handle ${activeHandle === sId ? 'active-handle' : ''}`}
                style={{ position: 'absolute', width: '16px', height: '16px', right: '2px', borderRadius: '50%', background: '#1a1f35', border: `2px solid ${activeHandle === sId ? '#34d399' : '#6366f1'}`, zIndex: 10, cursor: 'pointer' }}
              />
              <span className="table-node__column-icon">{isPk ? '🔑' : isFkSource ? '🔗' : ''}</span>
              <span className="table-node__column-name">{col.column_name}</span>
              <span className="table-node__column-type">{formatType(col.data_type)}</span>
            </div>
          );
        })}

        {!isDeleted && (
          <div className="table-node__column new-relation-zone" style={{ position: 'relative', borderTop: '1px dashed #3f3f46', justifyContent: 'center', opacity: 0.8, background: 'rgba(99, 102, 241, 0.1)', marginTop: 4 }}>
            <Handle type="target" position={Position.Left} id={`${tableName}-new-target`}
              onClick={(e) => {
                e.stopPropagation();
                const conn = useCanvasStore.getState().handleHandleClick({ nodeId: tableName, handleId: `${tableName}-new-target`, type: 'target' });
                if (conn) useCanvasStore.setState({ pendingConnection: conn });
              }}
              className={`custom-new-handle ${activeHandle === `${tableName}-new-target` ? 'active-handle' : ''}`}
              style={{ position: 'absolute', width: '20px', height: '20px', left: '-10px', borderRadius: '50%', background: '#1a1f35', border: '2px dashed #6366f1', zIndex: 10, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 11, color: '#a1a1aa' }}>[+] Перетягніть для зв'язку</span>
          </div>
        )}
      </div>

      <div className="table-node__footer nodrag">
        <button className="btn btn--secondary btn--sm" id={`btn-view-${tableName}`}
          onClick={(e) => { e.stopPropagation(); if (!isDeleted) selectTable(tableName); }}
          disabled={isDeleted}
        >
          📋 Переглянути дані
        </button>
      </div>
    </div>
  );
}

export default memo(TableNode);
