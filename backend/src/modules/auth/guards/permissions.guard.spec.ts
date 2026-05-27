import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constant';

function makeContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new PermissionsGuard(reflector);
  });

  it('allows when no permissions are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ permissions: [] }))).toBe(true);
  });

  it('allows when user has all required permissions', () => {
    reflector.getAllAndOverride.mockReturnValue([
      PERMISSIONS.MEDICINE_READ,
      PERMISSIONS.MEDICINE_CREATE,
    ]);
    expect(
      guard.canActivate(
        makeContext({
          id: 'u1',
          permissions: [
            PERMISSIONS.MEDICINE_READ,
            PERMISSIONS.MEDICINE_CREATE,
            PERMISSIONS.MEDICINE_DELETE,
          ],
        }),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException when user is missing one permission', () => {
    reflector.getAllAndOverride.mockReturnValue([
      PERMISSIONS.MEDICINE_READ,
      PERMISSIONS.MEDICINE_CREATE,
    ]);
    expect(() =>
      guard.canActivate(
        makeContext({ id: 'u1', permissions: [PERMISSIONS.MEDICINE_READ] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([PERMISSIONS.MEDICINE_READ]);
    expect(() =>
      guard.canActivate(makeContext(undefined)),
    ).toThrow(ForbiddenException);
  });
});
