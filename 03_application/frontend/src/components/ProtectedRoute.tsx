/**
 * File Purpose: ProtectedRoute.tsx
 * Inputs: Component props, API payloads, and user interactions where applicable.
 * Outputs: Rendered UI, API calls, and state updates.
 * Process: Implements module-specific frontend behavior.
 * Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
 */

import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, isLoading } = useAuth();
  if (isLoading) {
    return <div className="page"><div className="card">Loading...</div></div>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
