import { IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserPermissionEffect } from '../entities/user-permission.entity';

export class UserPermissionGrantItem {
  @IsUUID('4')
  permissionId!: string;

  @IsEnum(UserPermissionEffect)
  effect!: UserPermissionEffect;
}

export class GrantPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionGrantItem)
  grants!: UserPermissionGrantItem[];
}
