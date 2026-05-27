import { render, screen } from '@testing-library/react';
import { PermissionGate } from '@/components/common/permission-gate';
import { PERMISSIONS } from '@/lib/types';

const mockHasPermission = jest.fn();
const mockHasAnyPermission = jest.fn();

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    hasPermission: mockHasPermission,
    hasAnyPermission: mockHasAnyPermission,
  }),
}));

describe('PermissionGate', () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
    mockHasAnyPermission.mockReset();
  });

  it('renders children when user has the required permission', () => {
    mockHasPermission.mockReturnValue(true);
    render(
      <PermissionGate permission={PERMISSIONS.MEDICINE_CREATE}>
        <button>Add</button>
      </PermissionGate>,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('hides children when user lacks the permission', () => {
    mockHasPermission.mockReturnValue(false);
    render(
      <PermissionGate permission={PERMISSIONS.MEDICINE_CREATE}>
        <button>Add</button>
      </PermissionGate>,
    );
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  it('renders fallback when permission is missing', () => {
    mockHasPermission.mockReturnValue(false);
    render(
      <PermissionGate
        permission={PERMISSIONS.MEDICINE_CREATE}
        fallback={<span>No access</span>}
      >
        <button>Add</button>
      </PermissionGate>,
    );
    expect(screen.getByText('No access')).toBeInTheDocument();
  });

  it('checks anyOf permissions', () => {
    mockHasAnyPermission.mockReturnValue(true);
    render(
      <PermissionGate
        anyOf={[PERMISSIONS.MEDICINE_CREATE, PERMISSIONS.MEDICINE_UPDATE]}
      >
        <span>Visible</span>
      </PermissionGate>,
    );
    expect(screen.getByText('Visible')).toBeInTheDocument();
    expect(mockHasAnyPermission).toHaveBeenCalledWith(
      PERMISSIONS.MEDICINE_CREATE,
      PERMISSIONS.MEDICINE_UPDATE,
    );
  });
});
