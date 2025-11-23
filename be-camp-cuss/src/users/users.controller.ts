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
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApproveDriverRequestDto } from './dto/approve-driver-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { UsersDriverRequestService } from './services/users-driver-request.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateDriverRequest } from './dto/create-driver-request.dto';

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

    return { message: 'Pengguna dibuat', data: user };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { message: 'Daftar pengguna', data: users };
  }

  @Post('request-driver')
  async requestDriver(
    @User('id') userId: number,
    @Body() dto: CreateDriverRequest,
  ) {
    const createdDriverRequest =
      await this.driverRequestService.createDriverRequest(userId, dto);
    return {
      message: 'Permintaan driver telah dibuat',
      data: createdDriverRequest,
    };
  }

  @Roles(Role.admin)
  @Get('driver-requests')
  async listDriverRequests() {
    const requests = await this.driverRequestService.findAllDriverRequests();
    if (requests.length === 0) {
      return { message: 'Tidak ada permintaan driver', data: [] };
    }

    return { message: 'Daftar permintaan driver', data: requests };
  }

  @Roles(Role.admin)
  @Post('driver-requests/:id/approve')
  async approveDriverRequest(
    @Param('id', ParseIntPipe) driverRequestId: number,
    @Body() dto: ApproveDriverRequestDto,
    @User('id') adminId: number,
  ) {
    const result = await this.driverRequestService.approveDriverRequest(
      driverRequestId,
      adminId,
      dto,
    );

    return { message: 'Permintaan driver disetujui', data: result };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return { message: 'Detail pengguna', data: user };
  }

  @Patch(':id')
  async update(
    @User('id') accessUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.update(accessUserId, id, dto);
    return { message: 'Data pengguna diperbarui', data: updatedUser };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(id);
    return { message: 'Pengguna dihapus', data: user };
  }
}
