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

  @IsNumber({}, { message: 'estimated harus berupa angka' })
  @Min(0, { message: 'estimated harus bernilai minimal 0' })
  estimated: number;

  @IsOptional()
  @IsString({ message: 'imagePlace harus berupa string' })
  imagePlace: string | null;
}
