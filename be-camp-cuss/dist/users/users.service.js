"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_services_1 = require("../prisma/prisma.services");
let UsersService = class UsersService {
    prisma;
    BCRYPT_ROUNDS = 10;
    USER_SELECT_FIELDS = {
        id: true,
        username: true,
        email: true,
        npm: true,
        no_phone: true,
        role: true,
    };
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        await this.validateUniqueFields(dto.email, dto.username);
        const hashedPassword = await this.hashPassword(dto.password);
        return this.prisma.users.create({
            data: { ...dto, password: hashedPassword },
            select: { id: true, email: true },
        });
    }
    async findAll() {
        const users = await this.prisma.users.findMany({
            select: this.USER_SELECT_FIELDS,
        });
        if (users.length === 0) {
            this.throwNotFound('No users found', 'No users available in the database');
        }
        return users;
    }
    async findOne(id) {
        const user = await this.prisma.users.findUnique({
            where: { id },
            select: this.USER_SELECT_FIELDS,
        });
        if (!user) {
            this.throwNotFound('User not found', 'No user with the given ID exists');
        }
        return user;
    }
    async update(id, updateUserDto) {
        const existingUser = await this.findUserById(id);
        await this.validateUniqueFieldsForUpdate(updateUserDto, existingUser);
        const password = updateUserDto.password
            ? await this.hashPassword(updateUserDto.password)
            : existingUser.password;
        return this.prisma.users.update({
            where: { id },
            data: { ...updateUserDto, password },
            select: this.USER_SELECT_FIELDS,
        });
    }
    async remove(id) {
        await this.findUserById(id);
        await this.prisma.users.delete({ where: { id } });
        return null;
    }
    async findUserById(id) {
        const user = await this.prisma.users.findUnique({ where: { id } });
        if (!user) {
            this.throwNotFound('User not found', 'No user with the given ID exists');
        }
        return user;
    }
    async validateUniqueFields(email, username) {
        const [emailExists, usernameExists] = await Promise.all([
            this.prisma.users.findUnique({ where: { email } }),
            this.prisma.users.findUnique({ where: { username } }),
        ]);
        if (emailExists || usernameExists) {
            throw new common_1.HttpException({
                message: 'Validation failed',
                errors: {
                    email: emailExists ? 'Email already used' : undefined,
                    username: usernameExists ? 'Username already used' : undefined,
                },
            }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async validateUniqueFieldsForUpdate(updateDto, existingUser) {
        const validations = [];
        if (updateDto.email && updateDto.email !== existingUser.email) {
            validations.push(this.prisma.users
                .findUnique({ where: { email: updateDto.email } })
                .then((exists) => ({ field: 'email', exists })));
        }
        if (updateDto.username && updateDto.username !== existingUser.username) {
            validations.push(this.prisma.users
                .findUnique({ where: { username: updateDto.username } })
                .then((exists) => ({ field: 'username', exists })));
        }
        if (validations.length > 0) {
            const results = await Promise.all(validations);
            const conflicts = results.filter((result) => result.exists);
            if (conflicts.length > 0) {
                const errors = conflicts.reduce((acc, conflict) => {
                    acc[conflict.field] =
                        `${conflict.field.charAt(0).toUpperCase() + conflict.field.slice(1)} already used`;
                    return acc;
                }, {});
                throw new common_1.HttpException({ message: 'Validation failed', errors }, common_1.HttpStatus.BAD_REQUEST);
            }
        }
    }
    async hashPassword(password) {
        return bcrypt.hash(password, this.BCRYPT_ROUNDS);
    }
    throwNotFound(message, errorDetail) {
        throw new common_1.HttpException({ message, errors: { user: errorDetail } }, common_1.HttpStatus.NOT_FOUND);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_services_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map