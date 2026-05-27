import { ApiError, tokenStorage } from '@/lib/api/client';

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists tokens to localStorage', () => {
    tokenStorage.set('abc');
    expect(tokenStorage.get()).toBe('abc');
  });

  it('clears tokens', () => {
    tokenStorage.set('abc');
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });

  it('returns null when no token is stored', () => {
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('ApiError', () => {
  it('captures status and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('ApiError');
  });

  it('captures details array', () => {
    const err = new ApiError(400, 'Validation', ['email invalid', 'name too short']);
    expect(err.details).toEqual(['email invalid', 'name too short']);
  });

  it('is throwable and catchable as Error', () => {
    const thrown = () => {
      throw new ApiError(500, 'boom');
    };
    expect(thrown).toThrow(ApiError);
    expect(thrown).toThrow('boom');
  });
});
