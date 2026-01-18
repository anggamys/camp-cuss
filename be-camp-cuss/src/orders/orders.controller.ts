import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrdersCoreService } from './services/orders-core.service';
import { OrdersDriverService } from './services/orders-driver.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/user.enum';
import { User } from '../common/decorators/user.decorator';
import { OrdersCustomerService } from './services/orders-customer.service';
import { ApiQueryParams } from '../common/types/api-request.interface';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersCore: OrdersCoreService,
    private readonly ordersDriver: OrdersDriverService,
    private readonly ordercustomer: OrdersCustomerService,
  ) {}

  // Customer actions
  @Post()
  @Roles(Role.Customer)
  async create(
    @Body() dto: CreateOrderDto,
    @User('userId') customerId: number,
  ) {
    const order = await this.ordersCore.create(customerId, dto);
    return {
      status: 'success',
      message: 'Pesanan berhasil dibuat',
      data: order,
      meta: null,
    };
  }

  @Get()
  @Roles(Role.Admin, Role.Customer, Role.Driver)
  async findAll(
    @User('role') role: Role,
    @User('userId') userId: number,
    @Query() query: ApiQueryParams,
  ) {
    const { data, meta } = await this.ordersCore.findAll(role, userId, query);

    if (data.length === 0) {
      return {
        status: 'success',
        message: 'Tidak ada pesanan ditemukan',
        data: [],
        meta,
      };
    }

    return {
      status: 'success',
      message: 'Daftar pesanan berhasil ditemukan',
      data,
      meta,
    };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Driver)
  async findOne(@Param('id') id: string) {
    const order = await this.ordersCore.findOne(+id);
    return {
      status: 'success',
      message: 'Pesanan berhasil ditemukan',
      data: order,
      meta: null,
    };
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    const order = await this.ordersCore.update(+id, dto);
    return {
      status: 'success',
      message: 'Pesanan berhasil diperbarui',
      data: order,
      meta: null,
    };
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    await this.ordersCore.remove(+id);
    return {
      status: 'success',
      message: 'Pesanan berhasil dihapus',
      data: null,
      meta: null,
    };
  }

  @Post(':id/cancel')
  @Roles(Role.Customer)
  async cancelOrder(
    @Param('id') orderId: string,
    @User('userId') userId: number,
  ) {
    const order = await this.ordercustomer.cancelOrder(+orderId, userId);
    return {
      status: 'success',
      message: 'Pesanan berhasil dibatalkan',
      data: order,
      meta: null,
    };
  }

  // Driver actions
  @Post(':id/accept')
  @Roles(Role.Driver)
  async acceptOrder(
    @Param('id') orderId: string,
    @User('userId') driverId: number,
  ) {
    const order = await this.ordersDriver.acceptOrder(+orderId, driverId);
    return {
      status: 'success',
      message: 'Pesanan berhasil diterima oleh driver',
      data: order,
      meta: null,
    };
  }

  @Post(':id/complete')
  @Roles(Role.Driver)
  async completeOrder(
    @Param('id') orderId: string,
    @User('userId') driverId: number,
  ) {
    const order = await this.ordersDriver.completeOrder(+orderId, driverId);
    return {
      status: 'success',
      message: 'Pesanan berhasil diselesaikan oleh driver',
      data: order,
      meta: null,
    };
  }
}
