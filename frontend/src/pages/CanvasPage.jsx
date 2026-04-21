import React, { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useConnectionStore from '../stores/connectionStore';
import useSchemaStore from '../stores/schemaStore';
import useCanvasStore from '../stores/canvasStore';
import TableNode from '../components/TableNode';
import DataPanel from '../components/DataPanel';
import Toolbar from '../components/Toolbar';
import { createForeignKey, createColumnAndForeignKey, deleteForeignKey } from '../utils/api';

const nodeTypes = { tableNode: TableNode };

export default function CanvasPage() {
  const { config, disconnect } = useConnectionStore();
  const { tables, foreignKeys, fetchSchema, loading: schemaLoading } = useSchemaStore();
  const { selectedTable, selectTable, clearSelection, saveCurrentLayout } = useCanvasStore();
  const pendingChanges = useCanvasStore((s) => s.pendingChanges);
  const deletedNodeIds = useCanvasStore((s) => s.deletedNodeIds);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load schema on mount
  useEffect(() => {
    fetchSchema();
  }, []);

  // Build graph when schema loads
  useEffect(() => {
    if (tables.length > 0) {
      const buildGraph = async () => {
        const store = useCanvasStore.getState();
        await store.buildFromSchema(tables, foreignKeys);
        const state = useCanvasStore.getState();
        setNodes(state.nodes);
        setEdges(state.edges);
      };
      buildGraph();
    }
  }, [tables, foreignKeys]);

  // Intercept node changes — block 'remove' and route through softDeleteNode
  const handleNodesChange = useCallback(
    (changes) => {
      const removeChanges = changes.filter((c) => c.type === 'remove');
      const otherChanges = changes.filter((c) => c.type !== 'remove');

      // Apply non-remove changes normally
      if (otherChanges.length > 0) {
        onNodesChange(otherChanges);
      }

      // Route remove changes through draft mode
      removeChanges.forEach((change) => {
        useCanvasStore.getState().softDeleteNode(change.id);
        // Also sync edges state with store
        const storeEdges = useCanvasStore.getState().edges;
        setEdges(storeEdges);
      });
    },
    [onNodesChange, setEdges],
  );

  // Add deleted-node class info to nodes
  const displayNodes = nodes.map((node) => {
    if (deletedNodeIds.has(node.id)) {
      return {
        ...node,
        className: 'table-node--deleted-wrapper',
        data: { ...node.data, isDeleted: true },
      };
    }
    return node;
  });

  // Handle explicit Save
  const handleSaveChanges = async () => {
    const { pendingChanges, deletedNodeIds } = useCanvasStore.getState();
    if (pendingChanges.length === 0) return;

    setSaving(true);
    let successCount = 0;
    
    try {
      for (const change of pendingChanges) {
        if (change.type === 'ADD_COL_FK') {
          await createColumnAndForeignKey(change.data);
          successCount++;
        } else if (change.type === 'ADD_FK') {
          await createForeignKey(change.data);
          successCount++;
        } else if (change.type === 'DROP_FK') {
          await deleteForeignKey(change.data.constraintName, change.data.tableName);
          successCount++;
        } else if (change.type === 'DELETE_NODE') {
          // Visual-only removal — remove from local nodes
          setNodes((nds) => nds.filter((n) => n.id !== change.data.nodeId));
          successCount++;
        }
      }
      showMessage(`Успішно застосовано ${successCount} змін!`, 'success');
      useCanvasStore.getState().setPendingChanges([]);
      useCanvasStore.setState({ deletedNodeIds: new Set() });
      // Refresh schema for FK changes
      if (pendingChanges.some((c) => c.type !== 'DELETE_NODE')) {
        await fetchSchema();
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Не вдалося застосувати всі зміни', 'error');
      await fetchSchema();
    } finally {
      setSaving(false);
    }
  };

  // Handle undo
  const handleUndo = useCallback(() => {
    const store = useCanvasStore.getState();
    const lastChange = store.pendingChanges[store.pendingChanges.length - 1];
    
    store.undoLastChange();

    // Sync local React Flow state with store
    const updatedState = useCanvasStore.getState();
    setEdges(updatedState.edges);

    // If undoing a node deletion, un-mark it
    if (lastChange?.type === 'DELETE_NODE') {
      // nodes stay the same, just the deletedNodeIds changed (handled by displayNodes)
    }
  }, [setEdges]);

  // Handle new edge connection (queue FK instead of instant API call)
  const onConnect = useCallback(
    (connection) => {
      const sourceParts = connection.sourceHandle?.split('-') || [];
      const targetParts = connection.targetHandle?.split('-') || [];

      if (sourceParts.length >= 3 && targetParts.length >= 3) {
        let sourceTable = sourceParts[0];
        let sourceColumn = sourceParts.slice(1, -1).join('-');
        let targetTable = targetParts[0];
        let targetColumn = targetParts.slice(1, -1).join('-');

        const store = useCanvasStore.getState();
        const { tables } = useSchemaStore.getState();
        const tempEdgeId = `temp-${Date.now()}`;

        const sTableDef = tables.find((t) => t.table_name === sourceTable);
        const tTableDef = tables.find((t) => t.table_name === targetTable);
        const sColDef = sTableDef?.columns.find((c) => c.column_name === sourceColumn);
        const tColDef = tTableDef?.columns.find((c) => c.column_name === targetColumn);

        // Automatically determine parent-child direction.
        // The parent table is referenced, so its column should be the primary key.
        // The child table receives the constraint.
        // If user drags from Parent (PK) to Child (not PK), we swap them to match DB logic.
        if (sColDef?.is_primary_key && !tColDef?.is_primary_key && targetColumn !== 'new') {
          const tempTable = sourceTable;
          const tempCol = sourceColumn;
          sourceTable = targetTable;
          sourceColumn = targetColumn;
          targetTable = tempTable;
          targetColumn = tempCol;
        }

        if (targetColumn === 'new') {
          store.setPendingChanges((prev) => [
            ...prev,
            { type: 'ADD_COL_FK', data: { sourceTable, sourceColumn, targetTable, tempEdgeId } },
          ]);
          setEdges((eds) => addEdge({ ...connection, id: tempEdgeId, style: { stroke: '#fbbf24', strokeDasharray: '5 5' } }, eds));
        } else {
          store.setPendingChanges((prev) => [
            ...prev,
            { type: 'ADD_FK', data: { sourceTable, sourceColumn, targetTable, targetColumn, tempEdgeId } },
          ]);
          setEdges((eds) => addEdge({ ...connection, id: tempEdgeId, style: { stroke: '#fbbf24', strokeDasharray: '5 5' } }, eds));
        }
      } else {
        // Visual edge only
        setEdges((eds) => addEdge({ ...connection, style: { stroke: '#fbbf24' } }, eds));
      }
    },
    [setEdges],
  );

  const onEdgesDelete = useCallback((edgesToDelete) => {
    edgesToDelete.forEach((edge) => {
      // If it exists in DB, it has a constraint_name
      if (edge.data?.constraint_name) {
        useCanvasStore.getState().setPendingChanges((prev) => [
          ...prev,
          {
            type: 'DROP_FK',
            data: {
              constraintName: edge.data.constraint_name,
              tableName: edge.data.source_table,
              edgeSnapshot: edge,
            },
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    // Listen for click-to-connect triggers from CanvasStore
    return useCanvasStore.subscribe((state, prevState) => {
      if (state.pendingConnection && state.pendingConnection !== prevState.pendingConnection) {
        onConnect(state.pendingConnection);
        useCanvasStore.setState({ pendingConnection: null }); // clear after handling
      }
    });
  }, [onConnect]);

  const onNodeClick = useCallback((event, node) => {
    // Don't select deleted nodes
    if (deletedNodeIds.has(node.id)) return;
    selectTable(node.id);
  }, [selectTable, deletedNodeIds]);

  const handleSaveLayout = async () => {
    setSaving(true);
    const store = useCanvasStore.getState();
    nodes.forEach((n) => store.updateNodePosition(n.id, n.position));
    const success = await store.saveCurrentLayout();
    setSaving(false);
    showMessage(success ? 'Макет збережено!' : 'Не вдалося зберегти макет', success ? 'success' : 'error');
  };

  const handleRefreshSchema = async () => {
    useCanvasStore.getState().discardAllChanges();
    await fetchSchema();
    showMessage('Схему оновлено!', 'success');
  };

  const handleDisconnect = async () => {
    await disconnect();
    useSchemaStore.getState().clearSchema();
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  if (schemaLoading && nodes.length === 0) {
    return (
      <div className="canvas-page">
        <div className="loading-overlay">
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <span>Завантаження схеми бази даних...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-page">
      <div className="canvas-wrapper">
        <Toolbar
          dbName={config?.database}
          onSave={handleSaveLayout}
          onRefresh={handleRefreshSchema}
          onDisconnect={handleDisconnect}
          onUndo={handleUndo}
          saving={saving}
          message={message}
          pendingChanges={pendingChanges}
          onSaveChanges={handleSaveChanges}
        />
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={() => clearSelection()}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e2440" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#6366f1"
            maskColor="rgba(10, 14, 26, 0.7)"
            style={{ background: '#111827' }}
          />
        </ReactFlow>
      </div>

      {selectedTable && (
        <DataPanel
          tableName={selectedTable}
          columns={
            tables.find((t) => t.table_name === selectedTable)?.columns || []
          }
          foreignKeys={foreignKeys.filter(
            (fk) => fk.source_table === selectedTable,
          )}
          onClose={clearSelection}
        />
      )}
    </div>
  );
}
