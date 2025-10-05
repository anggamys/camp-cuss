/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { HttpException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.services';
import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
    const emailExists = await this.prisma.users.findUnique({
      where: { email: createUserDto.email },
    });

    const usernameExists = await this.prisma.users.findUnique({
      where: { username: createUserDto.username },
    });

    if (emailExists || usernameExists) {
      throw new HttpException(
        'User with this email or username already exists',
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.prisma.users.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
  }

  // async findAll(): Promise<User[]> {
  //   return this.prisma.user.findMany();
  // }

  // async findOne(id: number): Promise<User | null> {
  //   return this.prisma.user.findUnique({
  //     where: { id },
  //   });
  // }

  // async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
  //   return this.prisma.user.update({
  //     where: { id },
  //     data: updateUserDto,
  //   });
  // }

  // async remove(id: number): Promise<User> {
  //   return this.prisma.user.delete({
  //     where: { id },
  //   });
  // }
}
