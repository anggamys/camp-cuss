import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveDriverRequestDto {
  @IsBoolean({ message: 'Status persetujuan harus berupa boolean' })
  approved: boolean;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}
