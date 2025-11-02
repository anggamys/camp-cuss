import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
} from 'class-validator';

export class CreateDestinationDto {
  @IsString({ message: 'nama harus berupa string' })
  @IsNotEmpty({ message: 'nama tidak boleh kosong' })
  name: string;

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

  @IsOptional()
  @IsString({ message: 'image_place harus berupa string' })
  image_place: string | null;

  @IsNumber({}, { message: 'estimated harus berupa angka' })
  @Min(0, { message: 'estimated harus bernilai minimal 0' })
  estimated: number;

  @IsDate()
  @IsNotEmpty({ message: 'created_at tidak boleh kosong' })
  created_at: Date;

  @IsDate()
  @IsNotEmpty({ message: 'updated_at tidak boleh kosong' })
  updated_at: Date;
}
