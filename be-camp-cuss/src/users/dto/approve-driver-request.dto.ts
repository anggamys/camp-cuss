import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class ApproveDriverRequestDto {
  @IsBoolean({ message: 'Status persetujuan harus berupa boolean' })
  approved: boolean;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}

export class ResponseApproveDriverRequestDto {
  @IsInt({ message: 'ID harus berupa integer' })
  id: number;

  @IsEnum(ApprovalStatus, {
    message: 'Status harus berupa salah satu dari: PENDING, APPROVED, REJECTED',
  })
  status: ApprovalStatus;

  @IsString({ message: 'Catatan pengguna harus berupa string' })
  @IsOptional({ message: 'Catatan pengguna harus berupa string' })
  user_notes: string | null;

  @IsString({ message: 'Catatan admin harus berupa string' })
  @IsOptional({ message: 'Catatan admin harus berupa string' })
  admin_notes: string | null;
  created_at: Date;

  @IsInt({ message: 'ID harus berupa integer' })
  @IsOptional({ message: 'ID harus berupa integer' })
  approved_by: number | null;
}
