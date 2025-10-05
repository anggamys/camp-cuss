import { Role } from '@prisma/client';
export declare class CreateUserDto {
    username: string;
    email: string;
    password: string;
    npm: string;
    no_phone: string;
    role: Role;
    ktm?: string;
    ktp?: string;
    sim?: string;
    photo_profile?: string;
    refresh_token?: string;
}
export declare class CreateUserResponseDto {
    id: number;
    email: string;
}
