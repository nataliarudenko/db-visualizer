import { create } from 'zustand';
import { getLayout, saveLayout as saveLayoutApi } from '../utils/api';

const useCanvasStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedTable: null,
  pendingChanges: [],
  deletedNodeIds: new Set(),
  activeHandle: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setPendingChanges: (changes) => set({ pendingChanges: typeof changes === 'function' ? changes(get().pendingChanges) : changes }),
  setActiveHandle: (handle) => set({ activeHandle: handle }),

  // Soft-delete a node: mark as deleted visually, add to pendingChanges
  softDeleteNode: (nodeId) => {
    const { nodes, edges, pendingChanges, deletedNodeIds } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Find edges connected to this node
    const connectedEdges = edges.filter(
      (e) => e.source === nodeId || e.target === nodeId,
    );

    const newDeleted = new Set(deletedNodeIds);
    newDeleted.add(nodeId);

    set({
      deletedNodeIds: newDeleted,
      // Hide connected edges
      edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      pendingChanges: [
        ...pendingChanges,
        {
          type: 'DELETE_NODE',
          data: {
            nodeId,
            nodeSnapshot: node,
            edgeSnapshots: connectedEdges,
          },
        },
      ],
    });
  },

  // Undo the last pending change
  undoLastChange: () => {
    const { pendingChanges, deletedNodeIds, edges } = get();
    if (pendingChanges.length === 0) return;

    const lastChange = pendingChanges[pendingChanges.length - 1];
    const newPending = pendingChanges.slice(0, -1);

    if (lastChange.type === 'DELETE_NODE') {
      const newDeleted = new Set(deletedNodeIds);
      newDeleted.delete(lastChange.data.nodeId);
      // Restore edges that were removed
      const restoredEdges = lastChange.data.edgeSnapshots || [];
      set({
        pendingChanges: newPending,
        deletedNodeIds: newDeleted,
        edges: [...edges, ...restoredEdges],
      });
    } else if (lastChange.type === 'DROP_FK') {
      // Restore the edge that was visually removed
      // We need to re-add the edge
      const edgeSnapshot = lastChange.data.edgeSnapshot;
      if (edgeSnapshot) {
        set({
          pendingChanges: newPending,
          edges: [...edges, edgeSnapshot],
        });
      } else {
        set({ pendingChanges: newPending });
      }
    } else if (lastChange.type === 'ADD_FK' || lastChange.type === 'ADD_COL_FK') {
      // Remove the temp edge that was added
      const tempEdgeId = lastChange.data.tempEdgeId;
      if (tempEdgeId) {
        set({
          pendingChanges: newPending,
          edges: edges.filter((e) => e.id !== tempEdgeId),
        });
      } else {
        set({ pendingChanges: newPending });
      }
    } else {
      set({ pendingChanges: newPending });
    }
  },

  // Reset all pending changes (discard draft)
  discardAllChanges: () => {
    set({
      pendingChanges: [],
      deletedNodeIds: new Set(),
    });
  },

  onNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      return { nodes: updatedNodes };
    });
  },

  selectTable: (tableName) => set({ selectedTable: tableName }),
  clearSelection: () => set({ selectedTable: null }),

  handleHandleClick: ({ nodeId, handleId, type }) => {
    const { activeHandle, activeHandleNode } = get();
    // If no active handle, just set it
    if (!activeHandle) {
      set({ activeHandle: handleId, activeHandleNode: nodeId, activeHandleType: type });
      return null;
    }
    // If clicking same handle, deselect
    if (activeHandle === handleId) {
      set({ activeHandle: null, activeHandleNode: null, activeHandleType: null });
      return null;
    }

    // Try to form a connection!
    const sourceHandle = type === 'source' ? handleId : activeHandle;
    const targetHandle = type === 'target' ? handleId : activeHandle;
    
    // Clear the active handle now
    set({ activeHandle: null, activeHandleNode: null, activeHandleType: null });
    
    // Return connection payload to whoever called it (e.g. CanvasPage)
    return {
      source: type === 'source' ? nodeId : activeHandleNode,
      target: type === 'target' ? nodeId : activeHandleNode,
      sourceHandle,
      targetHandle,
    };
  },

  buildFromSchema: async (tables, foreignKeys) => {
    // Try to load saved layout
    let savedLayout = {};
    try {
      const res = await getLayout();
      savedLayout = res.data || {};
    } catch {
      // no saved layout
    }

    // Build nodes from tables
    const nodes = tables.map((table, index) => {
      const saved = savedLayout[table.table_name];
      const cols = Math.ceil(Math.sqrt(tables.length));
      const defaultX = (index % cols) * 320 + 50;
      const defaultY = Math.floor(index / cols) * 300 + 80;

      return {
        id: table.table_name,
        type: 'tableNode',
        position: saved || { x: defaultX, y: defaultY },
        data: {
          tableName: table.table_name,
          columns: table.columns,
          foreignKeys: foreignKeys.filter(
            (fk) => fk.source_table === table.table_name || fk.target_table === table.table_name,
          ),
        },
      };
    });

    // Build edges from foreign keys
    const edges = foreignKeys.map((fk) => ({
      id: `${fk.constraint_name}`,
      source: fk.source_table,
      target: fk.target_table,
      sourceHandle: `${fk.source_table}-${fk.source_column}-source`,
      targetHandle: `${fk.target_table}-${fk.target_column}-target`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      label: fk.source_column,
      labelStyle: { fill: '#94a3b8', fontSize: 10 },
      labelBgStyle: { fill: '#1a1f35', fillOpacity: 0.9 },
      data: fk,
    }));

    set({ nodes, edges, deletedNodeIds: new Set(), pendingChanges: [] });
  },

  saveCurrentLayout: async () => {
    const { nodes } = get();
    const layoutData = {};
    nodes.forEach((node) => {
      layoutData[node.id] = node.position;
    });
    try {
      await saveLayoutApi(layoutData);
      return true;
    } catch {
      return false;
    }
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position } : n,
      ),
    }));
  },
}));

// Minimal applyNodeChanges helper
function applyNodeChanges(changes, nodes) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      const node = nodeMap.get(change.id);
      if (node) {
        nodeMap.set(change.id, { ...node, position: change.position });
      }
    } else if (change.type === 'select') {
      const node = nodeMap.get(change.id);
      if (node) {
        nodeMap.set(change.id, { ...node, selected: change.selected });
      }
    } else if (change.type === 'remove') {
      // DO NOT remove — this is handled by softDeleteNode via CanvasPage
      // nodeMap.delete(change.id);
    }
  }

  return Array.from(nodeMap.values());
}

export default useCanvasStore;
