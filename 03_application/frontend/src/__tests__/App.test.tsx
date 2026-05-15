/**
 * File Purpose: App.test.tsx
 * Inputs: Component props, API payloads, and user interactions where applicable.
 * Outputs: Rendered UI, API calls, and state updates.
 * Process: Implements module-specific frontend behavior.
 * Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

vi.mock('../components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

vi.mock('../pages/DashboardPage', () => ({
  default: () => <div>Dashboard Mock</div>,
}));

vi.mock('../pages/LoginPage', () => ({
  default: () => <div>Login Mock</div>,
}));

describe('App routes', () => {
  it('renders login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Mock')).toBeInTheDocument();
  });

  it('renders protected dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Mock')).toBeInTheDocument();
  });
});

