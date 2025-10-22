import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock,
}));

const signOutMock = jest.fn();
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: signOutMock,
    },
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

const toastMock = toast as unknown as {
  error: jest.Mock;
};

describe('Header auth actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
  });

  it('navigates to settings and logs out via Supabase', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole('button', { name: /open account menu/i });
    await user.click(trigger);

    const settingsItem = screen.getByRole('menuitem', { name: /settings/i });
    await user.click(settingsItem);

    expect(navigateMock).toHaveBeenCalledWith('/settings');

    await user.click(trigger);
    const logoutItem = screen.getByRole('menuitem', { name: /log out/i });
    await user.click(logoutItem);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login');
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('surfaces sign-out failures to the user', async () => {
    signOutMock.mockResolvedValueOnce({ error: new Error('network') });
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole('button', { name: /open account menu/i });
    await user.click(trigger);

    const logoutItem = screen.getByRole('menuitem', { name: /log out/i });
    await user.click(logoutItem);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalledWith('/login');
    expect(toastMock.error).toHaveBeenCalledWith(
      'Failed to log out. Please try again.',
    );
  });
});
