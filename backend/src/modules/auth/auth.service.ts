import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    roles: string[];
    permissions: string[];
  };
}

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.isActive) {
      return null;
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    return user;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    await this.usersService.updateLastLogin(user.id);
    return this.buildAuthResponse(user.id);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Tên đăng nhập đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, AuthService.SALT_ROUNDS);
    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
    });

    return this.buildAuthResponse(user.id);
  }

  async getProfile(userId: string): Promise<AuthResponse['user']> {
    const user = await this.usersService.findByIdWithPermissions(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    const permissions = await this.usersService.resolveEffectivePermissions(userId);
    const roles = user.userRoles?.map((ur) => ur.role.name) ?? [];
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      roles,
      permissions,
    };
  }

  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.SALT_ROUNDS);
  }

  private async buildAuthResponse(userId: string): Promise<AuthResponse> {
    const user = await this.usersService.findByIdWithPermissions(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    const permissions = await this.usersService.resolveEffectivePermissions(userId);
    const roles = user.userRoles?.map((ur) => ur.role.name) ?? [];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles,
        permissions,
      },
    };
  }
}
