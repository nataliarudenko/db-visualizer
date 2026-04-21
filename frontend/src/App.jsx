import React from 'react';
import useConnectionStore from './stores/connectionStore';
import ConnectionPage from './pages/ConnectionPage';
import CanvasPage from './pages/CanvasPage';

export default function App() {
  const connected = useConnectionStore((s) => s.connected);

  return connected ? <CanvasPage /> : <ConnectionPage />;
}
