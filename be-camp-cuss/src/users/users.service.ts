import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.services';
import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
import { FindUserResponseDto } from './dto/find-user.dto';
import { UpdateUserDto, UpdateUserResponseDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 10;
  private readonly USER_SELECT_FIELDS = {
    id: true,
    username: true,
    email: true,
    npm: true,
    no_phone: true,
    role: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    await this.validateUniqueFields(dto.email, dto.username);

    const hashedPassword = await this.hashPassword(dto.password);

    return this.prisma.users.create({
      data: { ...dto, password: hashedPassword },
      select: { id: true, email: true },
    });
  }

  async findAll(): Promise<FindUserResponseDto[]> {
    const users = await this.prisma.users.findMany({
      select: this.USER_SELECT_FIELDS,
    });

    if (users.length === 0) {
      this.throwNotFound(
        'No users found',
        'No users available in the database',
      );
    }

    return users;
  }

  async findOne(id: number): Promise<FindUserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: this.USER_SELECT_FIELDS,
    });

    if (!user) {
      this.throwNotFound('User not found', 'No user with the given ID exists');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
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

  async remove(id: number): Promise<null> {
    await this.findUserById(id);
    await this.prisma.users.delete({ where: { id } });
    return null;
  }

  // Private helper methods
  private async findUserById(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      this.throwNotFound('User not found', 'No user with the given ID exists');
    }
    return user;
  }

  private async validateUniqueFields(email: string, username: string) {
    const [emailExists, usernameExists] = await Promise.all([
      this.prisma.users.findUnique({ where: { email } }),
      this.prisma.users.findUnique({ where: { username } }),
    ]);

    if (emailExists || usernameExists) {
      throw new HttpException(
        {
          message: 'Validation failed',
          errors: {
            email: emailExists ? 'Email already used' : undefined,
            username: usernameExists ? 'Username already used' : undefined,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateUniqueFieldsForUpdate(
    updateDto: UpdateUserDto,
    existingUser: { email: string; username: string; password: string },
  ) {
    const validations: Promise<{ field: string; exists: any }>[] = [];

    if (updateDto.email && updateDto.email !== existingUser.email) {
      validations.push(
        this.prisma.users
          .findUnique({ where: { email: updateDto.email } })
          .then((exists) => ({ field: 'email', exists })),
      );
    }

    if (updateDto.username && updateDto.username !== existingUser.username) {
      validations.push(
        this.prisma.users
          .findUnique({ where: { username: updateDto.username } })
          .then((exists) => ({ field: 'username', exists })),
      );
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

        throw new HttpException(
          { message: 'Validation failed', errors },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  private throwNotFound(message: string, errorDetail: string): never {
    throw new HttpException(
      { message, errors: { user: errorDetail } },
      HttpStatus.NOT_FOUND,
    );
  }
}
