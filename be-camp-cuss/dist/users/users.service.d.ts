import { PrismaService } from '../prisma/prisma.services';
import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
import { FindUserResponseDto } from './dto/find-user.dto';
import { UpdateUserDto, UpdateUserResponseDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly BCRYPT_ROUNDS;
    private readonly USER_SELECT_FIELDS;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<CreateUserResponseDto>;
    findAll(): Promise<FindUserResponseDto[]>;
    findOne(id: number): Promise<FindUserResponseDto>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<UpdateUserResponseDto>;
    remove(id: number): Promise<null>;
    private findUserById;
    private validateUniqueFields;
    private validateUniqueFieldsForUpdate;
    private hashPassword;
    private throwNotFound;
}
