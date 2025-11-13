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
import { OrdersCoreService } from './services/orders-core.service';
import { OrdersDriverService } from './services/orders-driver.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../common/decorators/user.decorator';
import { OrdersCustomerService } from './services/orders-customer.service';

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
  @Roles(Role.customer)
  async create(@User('id') customerId: number, @Body() dto: CreateOrderDto) {
    const order = await this.ordersCore.create(customerId, dto);
    return {
      status: 'success',
      message: 'Pesanan berhasil dibuat',
      data: order,
      meta: null,
    };
  }

  @Get()
  @Roles(Role.admin)
  async findAll() {
    const orders = await this.ordersCore.findAll();
    return {
      status: 'success',
      message: 'Daftar pesanan berhasil diambil',
      data: orders,
      meta: { total: orders.length },
    };
  }

  @Get(':id')
  @Roles(Role.admin, Role.customer, Role.driver)
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
  @Roles(Role.admin)
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
  @Roles(Role.admin)
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
  @Roles(Role.customer)
  async cancelOrder(@Param('id') orderId: string, @User('id') userId: number) {
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
  @Roles(Role.driver)
  async acceptOrder(
    @Param('id') orderId: string,
    @User('id') driverId: number,
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
  @Roles(Role.driver)
  async completeOrder(
    @Param('id') orderId: string,
    @User('id') driverId: number,
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
