import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging:
    configService.get<string>('NODE_ENV') === 'development'
      ? ['error', 'warn']
      : ['error', 'warn'],
  autoLoadEntities: true,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
  },
});
