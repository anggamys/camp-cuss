import { Role } from '@prisma/client';
export declare class UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
    npm?: string;
    no_phone?: string;
    role?: Role;
    ktm?: string;
    ktp?: string;
    sim?: string;
    photo_profile?: string;
    refresh_token?: string;
}
export declare class UpdateUserResponseDto {
    id: number;
    username: string;
    email: string;
    npm: string;
    no_phone: string;
    role: Role;
}
