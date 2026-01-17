import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './components/Dashboard';
import { Analytics } from "@vercel/analytics/next"

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Analytics />
    <Dashboard />
  </React.StrictMode>
);