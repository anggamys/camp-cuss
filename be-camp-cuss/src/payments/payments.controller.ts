import {
  Controller,
  Post,
  Param,
  UseGuards,
  Body,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { PaymentsCoreService } from './services/payments-core.service';
import { MidtransCallbackDto } from './dto/midtrans-callback.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsCoreService: PaymentsCoreService) {}

  @Post(':orderId')
  @Roles(Role.driver)
  async createPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    const payment = await this.paymentsCoreService.create(orderId);

    return {
      status: 'success',
      message: 'Transaksi pembayaran berhasil dibuat',
      data: payment,
    };
  }

  @Public()
  @Post('midtrans/callback')
  async handleMidtransCallback(@Body() body: MidtransCallbackDto) {
    await this.paymentsCoreService.handleCallback(body);

    return {
      status: 'success',
      message: 'Callback diterima',
    };
  }

  @Get()
  @Roles(Role.admin)
  async getAllPayments() {
    const payments = await this.paymentsCoreService.getAll();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        message: 'Tidak ada transaksi pembayaran ditemukan',
        data: [],
      };
    }

    return {
      status: 'success',
      message: 'Daftar transaksi pembayaran berhasil diambil',
      data: payments,
    };
  }
}
