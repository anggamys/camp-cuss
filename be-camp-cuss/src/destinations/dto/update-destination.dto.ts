import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinationDto } from './create-destination.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {
  @IsNumber({}, { message: 'id harus berupa angka' })
  @IsNotEmpty({ message: 'id tidak boleh kosong' })
  id: number;
}
