import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        message: string;
        data: import("./dto/create-user.dto").CreateUserResponseDto;
    }>;
    findAll(): Promise<{
        message: string;
        data: import("./dto/find-user.dto").FindUserResponseDto[];
    }>;
    findOne(id: number): Promise<{
        message: string;
        data: import("./dto/find-user.dto").FindUserResponseDto;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
        message: string;
        data: import("./dto/update-user.dto").UpdateUserResponseDto;
    }>;
    remove(id: number): Promise<{
        message: string;
        data: null;
    }>;
}
