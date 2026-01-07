import { IsNumber, IsString } from 'class-validator';

export class FindDestinationResponseDto {
  @IsNumber({}, { message: 'ID harus berupa angka' })
  id: number;

  @IsString()
  name: string;

  @IsString()
  imagePlace: string;

  @IsNumber()
  estimatedTime: number;
}
