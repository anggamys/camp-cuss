import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinationDto } from './create-destination.dto';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {
  @IsNumber({}, { message: 'id harus berupa angka' })
  @IsNotEmpty({ message: 'id tidak boleh kosong' })
  id: number;
}

export class responseUpdateDestinationDto {
  @IsNumber({}, { message: 'id harus berupa angka' })
  id: number;

  @IsString({ message: 'nama harus berupa string' })
  @IsNotEmpty({ message: 'nama tidak boleh kosong' })
  name: string;

  @IsString({ message: 'image_place harus berupa string' })
  @IsNotEmpty({ message: 'image_place tidak boleh kosong' })
  image_place: string;

  @IsNumber({}, { message: 'latitude harus berupa angka' })
  @IsLatitude({ message: 'latitude harus berupa nilai lintang yang valid' })
  latitude: number;

  @IsNumber({}, { message: 'longitude harus berupa angka' })
  @IsLongitude({ message: 'longitude harus berupa nilai bujur yang valid' })
  longitude: number;

  @IsNumber({}, { message: 'estimated harus berupa angka' })
  @Min(0, { message: 'estimated harus bernilai minimal 0' })
  estimated: number;

  created_at: Date;
  updated_at: Date;
}
