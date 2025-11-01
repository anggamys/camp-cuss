import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateDestinationDto {
  @IsString({ message: 'nama harus berupa string' })
  @IsNotEmpty({ message: 'nama tidak boleh kosong' })
  name: string;

  @IsString({ message: 'image_place harus berupa string' })
  @IsOptional()
  image_place: string | null;

  @Type(() => Number)
  @IsNumber({}, { message: 'estimated harus berupa angka' })
  @Min(0, { message: 'estimated harus bernilai minimal 0' })
  estimated: number;
}

export class responseCreateDestinationDto {
  @IsNumber({}, { message: 'id harus berupa angka' })
  id: number;

  @IsString({ message: 'nama harus berupa string' })
  @IsNotEmpty({ message: 'nama tidak boleh kosong' })
  name: string;

  @IsString({ message: 'image_place harus berupa string' })
  @IsOptional()
  image_place: string | null;

  @IsNumber({}, { message: 'estimated harus berupa angka' })
  @Min(0, { message: 'estimated harus bernilai minimal 0' })
  estimated: number;

  created_at: Date;
  updated_at: Date;
}
