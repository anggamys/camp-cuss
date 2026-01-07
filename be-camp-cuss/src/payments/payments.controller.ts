import {
  Controller,
  Post,
  Param,
  UseGuards,
  Body,
  ParseIntPipe,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { MidtransCallbackDto } from './dto/midtrans-callback.dto';
import { PaymentsQueryService } from './services/payments-query.service';
import { PaymentsMidtransService } from './services/payments-midtrans.service';
import { PaymentsCallbackService } from './services/payments-callback.service';
import { ApiQueryParams } from '../common/types/api-request.interface';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentQueryService: PaymentsQueryService,
    private readonly paymentMidtransService: PaymentsMidtransService,
    private readonly paymentCallbackService: PaymentsCallbackService,
  ) {}

  @Post(':orderId')
  @Roles(Role.driver)
  async createPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    const payment =
      await this.paymentMidtransService.createTransaction(orderId);

    return {
      status: 'success',
      message: 'Transaksi pembayaran berhasil dibuat',
      data: payment,
    };
  }

  @Public()
  @Post('midtrans/callback')
  async handleMidtransCallback(@Body() body: MidtransCallbackDto) {
    await this.paymentCallbackService.process(body);

    return {
      status: 'success',
      message: 'Callback diterima',
    };
  }

  @Get()
  @Roles(Role.admin)
  async getAllPayments(@Query() query: ApiQueryParams) {
    const { data, meta } = await this.paymentQueryService.getAll(query);

    if (data.length === 0) {
      return {
        status: 'success',
        message: 'Tidak ada transaksi pembayaran ditemukan',
        data: [],
        meta,
      };
    }

    return {
      status: 'success',
      message: 'Daftar transaksi pembayaran berhasil diambil',
      data,
      meta,
    };
  }

  @Get(':midtransOrderId')
  async getPaymentById(@Param('midtransOrderId') midtransOrderId: string) {
    const payment =
      await this.paymentQueryService.getByMidtransId(midtransOrderId);

    if (!payment) {
      return {
        status: 'success',
        message: `Transaksi pembayaran dengan ID Midtrans ${midtransOrderId} tidak ditemukan`,
        data: null,
      };
    }

    return {
      status: 'success',
      message: 'Transaksi pembayaran berhasil diambil',
      data: payment,
    };
  }
}
