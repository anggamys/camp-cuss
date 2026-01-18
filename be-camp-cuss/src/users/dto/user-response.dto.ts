import { ApprovalStatus, Role } from '../../common/enums/user.enum';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  IsDate,
  IsPhoneNumber,
} from 'class-validator';

export class UserResponseDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  npm?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  driverStatus?: ApprovalStatus;

  @IsOptional()
  @IsPhoneNumber('ID')
  noPhone?: string;

  @IsOptional()
  @IsString()
  photoProfile?: string | null;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  photoIdCard?: string | null;

  @IsOptional()
  @IsString()
  photoStudentCard?: string | null;

  @IsOptional()
  @IsString()
  photoDriverLicense?: string | null;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}

export class DriverRequestResponseDto extends UserResponseDto {
  @IsOptional()
  @IsNumber()
  driverRequestId?: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  userNotes?: string | null;

  @IsOptional()
  @IsString()
  adminNotes?: string | null;

  @IsOptional()
  @IsNumber()
  approvedBy?: number | null;

  @IsOptional()
  @IsDate()
  driverRequestCreatedAt?: Date;

  @IsOptional()
  @IsDate()
  driverRequestUpdatedAt?: Date;
}
