import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return { message: 'User created successfully', data: user };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { message: 'Users retrieved successfully', data: users };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return { message: 'User retrieved successfully', data: user };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return { message: 'User updated successfully', data: updatedUser };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(+id);
    return { message: 'User deleted successfully', data: user };
  }
}
