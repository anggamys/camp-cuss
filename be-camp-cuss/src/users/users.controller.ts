import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApproveDriverRequestDto } from './dto/approve-driver-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { UsersDriverRequestService } from './services/users-driver-request.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/user.enum';
import { CreateDriverRequest } from './dto/create-driver-request.dto';
import { ApiQueryParams } from '../common/types/api-request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly driverRequestService: UsersDriverRequestService,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);

    return { message: 'Berhasil membuat pengguna', data: user };
  }

  @Get()
  async findAll(@Query() query: ApiQueryParams) {
    const { data: users, meta } = await this.usersService.findAll(query);

    if (users.length === 0) {
      return { message: 'Tidak ada pengguna ditemukan', data: [], meta };
    }

    return { message: 'Berhasil mengambil daftar pengguna', data: users, meta };
  }

  @Post('request-driver')
  async requestDriver(
    @User('userId') userId: number,
    @Body() dto: CreateDriverRequest,
  ) {
    const createdDriverRequest =
      await this.driverRequestService.createDriverRequest(userId, dto);

    return {
      message: 'Berhasil mengajukan permintaan driver',
      data: createdDriverRequest,
    };
  }

  @Roles(Role.Admin)
  @Get('driver-requests')
  async listDriverRequests(@Query() query: ApiQueryParams) {
    const { data: requests, meta } =
      await this.driverRequestService.findAllDriverRequests(query);

    if (requests.length === 0) {
      return { message: 'Tidak ada permintaan driver ditemukan', data: [] };
    }

    return {
      message: 'Berhasil mengambil daftar permintaan driver',
      data: requests,
      meta,
    };
  }

  @Roles(Role.Admin)
  @Post('driver-requests/:id/approve')
  async approveDriverRequest(
    @User('userId') adminId: number,
    @Body() dto: ApproveDriverRequestDto,
    @Param('id', ParseIntPipe) driverRequestId: number,
  ) {
    const result = await this.driverRequestService.approveDriverRequest(
      driverRequestId,
      adminId,
      dto,
    );

    return { message: 'Berhasil menyetujui permintaan driver', data: result };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return { message: 'Berhasil mengambil detail pengguna', data: user };
  }

  @Patch(':id')
  async update(
    @Body() dto: UpdateUserDto,
    @User('userId') accessUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const updatedUser = await this.usersService.update(accessUserId, id, dto);

    return { message: 'Berhasil memperbarui data pengguna', data: updatedUser };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(id);

    return { message: 'Berhasil menghapus pengguna', data: user };
  }
}
