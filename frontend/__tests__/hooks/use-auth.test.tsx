import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/hooks/use-auth';
import { tokenStorage } from '@/lib/api/client';
import { authApi } from '@/lib/api/resources';
import { PERMISSIONS } from '@/lib/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/api/resources', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
  },
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('starts with no user when no token is stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('restores user from stored token', async () => {
    tokenStorage.set('valid-token');
    mockAuthApi.me.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      username: 'ab',
      fullName: 'Alice',
      roles: ['admin'],
      permissions: [PERMISSIONS.MEDICINE_READ],
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('login persists token and sets user', async () => {
    mockAuthApi.me.mockResolvedValue(null as any);
    mockAuthApi.login.mockResolvedValue({
      accessToken: 'new-token',
      user: {
        id: 'u1',
        email: 'a@b.com',
        username: 'ab',
        fullName: 'Alice',
        roles: ['admin'],
        permissions: [PERMISSIONS.MEDICINE_READ],
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('a@b.com', 'pw');
    });

    expect(tokenStorage.get()).toBe('new-token');
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('hasPermission returns true when granted', async () => {
    tokenStorage.set('token');
    mockAuthApi.me.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      username: 'ab',
      fullName: 'Alice',
      roles: [],
      permissions: [PERMISSIONS.MEDICINE_READ, PERMISSIONS.MEDICINE_CREATE],
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    expect(result.current.hasPermission(PERMISSIONS.MEDICINE_READ)).toBe(true);
    expect(result.current.hasPermission(PERMISSIONS.MEDICINE_DELETE)).toBe(false);
  });

  it('hasAnyPermission returns true when at least one matches', async () => {
    tokenStorage.set('token');
    mockAuthApi.me.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      username: 'ab',
      fullName: 'Alice',
      roles: [],
      permissions: [PERMISSIONS.MEDICINE_READ],
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    expect(
      result.current.hasAnyPermission(
        PERMISSIONS.MEDICINE_DELETE,
        PERMISSIONS.MEDICINE_READ,
      ),
    ).toBe(true);
    expect(
      result.current.hasAnyPermission(
        PERMISSIONS.MEDICINE_DELETE,
        PERMISSIONS.USER_DELETE,
      ),
    ).toBe(false);
  });

  it('logout clears token and user', async () => {
    tokenStorage.set('token');
    mockAuthApi.me.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      username: 'ab',
      fullName: 'Alice',
      roles: [],
      permissions: [],
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => result.current.logout());

    expect(tokenStorage.get()).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
