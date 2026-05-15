/**
 * File Purpose: App.tsx
 * Inputs: Component props, API payloads, and user interactions where applicable.
 * Outputs: Rendered UI, API calls, and state updates.
 * Process: Implements module-specific frontend behavior.
 * Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
 */

import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
