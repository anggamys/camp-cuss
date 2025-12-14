import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class PaymentsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getAll() {
    try {
      const transactions = await this.prisma.transaction.findMany({
        include: { order: true },
      });

      return transactions;
    } catch (error) {
      this.logger.error(
        'Error fetching all transactions',
        PaymentsQueryService.name,
        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }

  async getById(transactionId: number) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { order: true },
      });

      return transaction;
    } catch (error) {
      this.logger.error(
        `Error fetching transaction by id: ${transactionId}`,
        PaymentsQueryService.name,
        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }
}
