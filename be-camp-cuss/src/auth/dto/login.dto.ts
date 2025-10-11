import { IsString, IsNotEmpty } from 'class-validator';

export class loginDto {
  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}

export class responseLoginDto {
  @IsString({ message: 'Access token harus berupa string' })
  @IsNotEmpty({ message: 'Access token tidak boleh kosong' })
  access_token: string;

  @IsString({ message: 'Refresh token harus berupa string' })
  @IsNotEmpty({ message: 'Refresh token tidak boleh kosong' })
  refresh_token: string;
}

export class refreshTokenDto {
  @IsString({ message: 'Refresh token harus berupa string' })
  @IsNotEmpty({ message: 'Refresh token tidak boleh kosong' })
  refresh_token: string;
}

export class responseRefreshTokenDto {
  @IsString({ message: 'Access token harus berupa string' })
  @IsNotEmpty({ message: 'Access token tidak boleh kosong' })
  access_token: string;
}
