import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { OrdersNotificationsGateway } from '../../orders-notifications/orders-notifications.gateway';
import { Order, OrderStatus } from '@prisma/client';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class OrdersBroadcastService implements OnModuleInit {
  private readonly activeIntervals = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersNotificationsGateway,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const pendingOrders = await this.prisma.order.findMany({
      where: { status: OrderStatus.pending },
    });

    if (pendingOrders.length === 0) return;

    await this.waitForGatewayReady();
    this.logger.log(`Memulihkan ${pendingOrders.length} order pending`);

    for (const order of pendingOrders) {
      this.broadcastAndSchedule(order.id, order);
    }
  }

  private async waitForGatewayReady(): Promise<void> {
    let retries = 0;
    while (!this.gateway['serverReady'] && retries < 20) {
      await new Promise((r) => setTimeout(r, 250));
      retries++;
    }
    if (!this.gateway['serverReady']) {
      this.logger.error('Gateway tidak siap setelah 5 detik');
    }
  }

  broadcastAndSchedule(orderId: number, order: Order): void {
    if (this.activeIntervals.has(orderId)) return;

    this.logger.log(`Broadcast awal untuk order #${orderId}`);
    void this.gateway.broadcastNewOrderAvailable(order);
    this.startRebroadcastLoop(orderId);
  }

  private startRebroadcastLoop(orderId: number): void {
    if (this.activeIntervals.has(orderId)) return;

    let tick = 0;
    const interval = setInterval(() => {
      void this.checkAndRebroadcast(orderId, tick++);
    }, 1000);

    this.activeIntervals.set(orderId, interval);
  }

  private async checkAndRebroadcast(
    orderId: number,
    tick: number,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.status !== OrderStatus.pending) {
      this.stopBroadcast(orderId);
      this.logger.log(`Broadcast order #${orderId} dihentikan`);
      return;
    }

    if (tick <= 10 || tick % 5 === 0) {
      await this.gateway.broadcastNewOrderAvailable(order);
    }
  }

  stopBroadcast(orderId: number): void {
    const interval = this.activeIntervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(orderId);
    }
  }
}
