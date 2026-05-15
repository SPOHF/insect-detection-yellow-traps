/**
 * File Purpose: ProtectedRoute.test.tsx
 * Inputs: Component props, API payloads, and user interactions where applicable.
 * Outputs: Rendered UI, API calls, and state updates.
 * Process: Implements module-specific frontend behavior.
 * Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

const useAuthMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('ProtectedRoute', () => {
  it('shows loading state', () => {
    useAuthMock.mockReturnValue({ token: null, isLoading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuthMock.mockReturnValue({ token: 't', isLoading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    useAuthMock.mockReturnValue({ token: null, isLoading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });
});
