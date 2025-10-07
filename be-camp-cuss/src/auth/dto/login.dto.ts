import { IsString, IsNotEmpty } from 'class-validator';

export class loginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class responseLoginDto {
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class refreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class responseRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
