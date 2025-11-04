import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';

jest.mock('../components/ui/dropdown-menu', () => {
  const React = require('react');

  const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  );

  const DropdownMenuTrigger = ({
    children,
  }: {
    children: React.ReactElement;
    asChild?: boolean;
  }) => React.cloneElement(children, {
    'aria-haspopup': 'menu',
    'aria-expanded': true,
    'data-state': 'open',
  });

  const DropdownMenuContent = ({
    children,
  }: {
    children: React.ReactNode;
    align?: string;
  }) => (
    <div role="menu">
      {children}
    </div>
  );

  const DropdownMenuItem = ({
    children,
    onSelect,
    className,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    className?: string;
  }) => (
    <button
      type="button"
      role="menuitem"
      className={className}
      onClick={onSelect}
    >
      {children}
    </button>
  );

  const DropdownMenuSeparator = () => <hr role="separator" />;

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

const mockUseNavigate = jest.requireMock('react-router-dom')
  .useNavigate as jest.Mock;
const mockNavigate = jest.fn();
mockUseNavigate.mockReturnValue(mockNavigate);

const mockSignOut = jest.requireMock('../lib/supabaseClient').supabase.auth
  .signOut as jest.Mock;

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

const toastMock = toast as unknown as {
  error: jest.Mock;
};

const setupUser = () =>
  typeof (userEvent as any).setup === 'function'
    ? (userEvent as any).setup()
    : userEvent;

describe('Header auth actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockNavigate.mockClear();
    mockSignOut.mockResolvedValue({ error: null });
    mockNavigate.mockClear();
  });

  it('navigates to settings and logs out via Supabase', async () => {
    const user = setupUser();
    render(<Header />);

    const trigger = screen.getByRole('button', { name: /open account menu/i });
    await user.click(trigger);
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    const settingsItem = await screen.findByRole('menuitem', { name: /settings/i });
    await user.click(settingsItem);

    expect(mockNavigate).toHaveBeenCalledWith('/settings');

    await user.click(trigger);
    const logoutItem = await screen.findByRole('menuitem', { name: /log out/i });
    await user.click(logoutItem);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('surfaces sign-out failures to the user', async () => {
    mockSignOut.mockResolvedValueOnce({ error: new Error('network') });
    const user = setupUser();
    render(<Header />);

    const trigger = screen.getByRole('button', { name: /open account menu/i });
    await user.click(trigger);
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    const logoutItem = await screen.findByRole('menuitem', { name: /log out/i });
    await user.click(logoutItem);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'Failed to log out. Please try again.',
      );
    });
  });
});
