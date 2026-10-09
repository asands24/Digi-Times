import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from '../pages/AuthCallback';
jest.mock('../lib/supabaseClient', () => ({ supabase: { auth: { getSession: jest.fn() } } }));
const getSession = jest.requireMock('../lib/supabaseClient').supabase.auth.getSession;
beforeEach(() => { jest.useFakeTimers(); window.history.replaceState({}, '', '/auth/callback?next=%2Fcreate%3Ftemplate%3Dtravel'); });
afterEach(() => { jest.useRealTimers(); window.history.replaceState({}, '', '/'); });
function mount() { render(<MemoryRouter initialEntries={['/auth/callback']}><Routes><Route path="/auth/callback" element={<AuthCallback />} /><Route path="/create" element={<p>Studio ready</p>} /><Route path="/login" element={<p>Request a new link</p>} /></Routes></MemoryRouter>); }
it('uses the session already detected by the SDK before returning to the studio', async () => {
  getSession.mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null });
  mount();
  await act(async () => {});
  expect(screen.getByText('Signed in. Redirecting…')).toBeVisible();
  act(() => { jest.advanceTimersByTime(600); });
  expect(screen.getByText('Studio ready')).toBeVisible();
});
it('does not report successful login without a session', async () => {
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  mount();
  await act(async () => {});
  expect(screen.getByText(/Sign-in could not be completed/)).toBeVisible();
  act(() => { jest.advanceTimersByTime(1500); });
  expect(screen.getByText('Request a new link')).toBeVisible();
});
