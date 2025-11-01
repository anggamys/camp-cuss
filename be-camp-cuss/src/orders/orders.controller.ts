import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.customer)
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);
    return {
      status: 'success',
      message: 'Pesanan berhasil dibuat',
      data: order,
    };
  }

  @Get()
  @Roles(Role.admin)
  async findAll() {
    const orders = await this.ordersService.findAll();
    return {
      status: 'success',
      message: 'Pesanan berhasil diambil',
      data: orders,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(+id);
    return {
      status: 'success',
      message: 'Pesanan berhasil diambil',
      data: order,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    const order = await this.ordersService.update(+id, dto);
    return {
      status: 'success',
      message: 'Pesanan berhasil diperbarui',
      data: order,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(+id);
    return {
      status: 'success',
      message: 'Pesanan berhasil dihapus',
      data: null,
    };
  }

  @Post(':id/accept/:driverId')
  @Roles(Role.driver)
  async acceptOrder(
    @Param('id') id: string,
    @Param('driverId') driverId: string,
  ) {
    const order = await this.ordersService.acceptOrder(+id, +driverId);
    return {
      status: 'success',
      message: 'Pesanan berhasil diterima',
      data: order,
    };
  }
}
