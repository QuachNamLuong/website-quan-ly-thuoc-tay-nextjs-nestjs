import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmailWithPassword: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findByIdWithPermissions: jest.fn(),
            resolveEffectivePermissions: jest.fn(),
            updateLastLogin: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      const user = {
        id: 'u1',
        email: 'a@b.com',
        username: 'ab',
        passwordHash,
        isActive: true,
      } as User;
      usersService.findByEmailWithPassword.mockResolvedValue(user);

      const result = await service.validateUser('a@b.com', 'secret123');
      expect(result).toBe(user);
    });

    it('returns null when password is wrong', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        passwordHash,
        isActive: true,
      } as User);

      const result = await service.validateUser('a@b.com', 'wrong');
      expect(result).toBeNull();
    });

    it('returns null when user is inactive', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        passwordHash,
        isActive: false,
      } as User);
      const result = await service.validateUser('a@b.com', 'secret123');
      expect(result).toBeNull();
    });

    it('returns null when user not found', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      const result = await service.validateUser('x@y.com', 'pw');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException with bad credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      await expect(
        service.login({ email: 'a@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns access token and user payload on success', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      const user = {
        id: 'u1',
        email: 'a@b.com',
        username: 'ab',
        passwordHash,
        isActive: true,
        fullName: 'Test',
      } as User;
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      usersService.findByIdWithPermissions.mockResolvedValue({
        ...user,
        userRoles: [{ role: { name: 'admin' } }],
      } as unknown as User);
      usersService.resolveEffectivePermissions.mockResolvedValue([
        'medicine:read',
      ]);

      const result = await service.login({
        email: 'a@b.com',
        password: 'secret123',
      });

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.permissions).toContain('medicine:read');
      expect(result.user.roles).toContain('admin');
      expect(usersService.updateLastLogin).toHaveBeenCalledWith('u1');
    });
  });

  describe('register', () => {
    it('throws ConflictException when email already taken', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'x' } as User);
      await expect(
        service.register({
          email: 'a@b.com',
          username: 'ab',
          password: 'pw',
          fullName: 'A',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ConflictException when username already taken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue({ id: 'x' } as User);
      await expect(
        service.register({
          email: 'a@b.com',
          username: 'ab',
          password: 'pw',
          fullName: 'A',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates user with hashed password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      const createdUser = {
        id: 'u1',
        email: 'a@b.com',
        username: 'ab',
        fullName: 'A',
      } as User;
      usersService.createUser.mockResolvedValue(createdUser);
      usersService.findByIdWithPermissions.mockResolvedValue({
        ...createdUser,
        userRoles: [],
      } as unknown as User);
      usersService.resolveEffectivePermissions.mockResolvedValue([]);

      await service.register({
        email: 'a@b.com',
        username: 'ab',
        password: 'secret123',
        fullName: 'A',
      });

      expect(usersService.createUser).toHaveBeenCalledTimes(1);
      const call = usersService.createUser.mock.calls[0][0];
      expect(call.passwordHash).not.toBe('secret123');
      expect(
        await bcrypt.compare('secret123', call.passwordHash),
      ).toBe(true);
    });
  });
});
