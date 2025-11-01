import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { UserRole, ApprovalStatus } from '@prisma/client';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import {
  CreateRequestDriverDto,
  ResponseCreateRequestDriverDto,
} from '../dto/create-approve-driver.dto';
import {
  ApproveDriverRequestDto,
  ResponseApproveDriverRequestDto,
} from '../dto/approve-driver-request.dto';
import { DriverRequestItemDto } from '../dto/list-driver-requests.dto';

@Injectable()
export class UsersApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async requestDriver(
    user_id: number,
    dto: CreateRequestDriverDto,
  ): Promise<ResponseCreateRequestDriverDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });
      if (!user)
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      if (user.role === UserRole.driver)
        throw new HttpException(
          'Anda sudah menjadi driver',
          HttpStatus.BAD_REQUEST,
        );

      // Validasi kelengkapan data penting
      const required = [
        user.photo_profile,
        user.photo_id_card,
        user.photo_student_card,
        user.photo_driving_license,
      ];
      if (required.some((x) => !x))
        throw new HttpException(
          'Lengkapi seluruh dokumen sebelum mengajukan permintaan driver',
          HttpStatus.BAD_REQUEST,
        );

      // Cek existing request aktif
      const activeRequest = await this.prisma.driverRequest.findFirst({
        where: {
          user_id: user_id,
          status: { in: [ApprovalStatus.pending, ApprovalStatus.approved] },
        },
      });

      if (activeRequest) {
        const message =
          activeRequest.status === ApprovalStatus.pending
            ? 'Permintaan Anda masih menunggu persetujuan'
            : 'Anda sudah terdaftar sebagai driver';
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      const createdRequest = await this.prisma.driverRequest.create({
        data: { user_id: user_id, user_notes: dto.user_notes ?? null },
        select: {
          id: true,
          user_id: true,
          status: true,
          user_notes: true,
          admin_notes: true,
          approved_by: true,
        },
      });

      return createdRequest;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async listRequests(): Promise<DriverRequestItemDto[]> {
    try {
      const requests = await this.prisma.driverRequest.findMany({
        where: { status: ApprovalStatus.pending },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              npm: true,
              no_phone: true,
            },
          },
        },
      });

      if (requests.length === 0) {
        return [];
      }

      return requests.map((request) => ({
        id: request.id,
        status: request.status,
        user_notes: request.user_notes,
        admin_notes: request.admin_notes,
        created_at: request.created_at,
        user: {
          id: request.user.id,
          username: request.user.username,
          email: request.user.email,
          npm: request.user.npm,
          no_phone: request.user.no_phone,
        },
      }));
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async approveRequest(
    request_id: number,
    admin_id: number,
    dto: ApproveDriverRequestDto,
  ): Promise<ResponseApproveDriverRequestDto> {
    try {
      const { approved, admin_notes } = dto;

      const request = await this.prisma.driverRequest.findUnique({
        where: { id: request_id },
        include: { user: true },
      });

      if (!request)
        throw new HttpException(
          'Permintaan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      if (
        request.status !== ApprovalStatus.pending ||
        request.approved_by !== null
      )
        throw new HttpException(
          'Permintaan ini sudah diproses',
          HttpStatus.CONFLICT,
        );

      const newStatus = approved
        ? ApprovalStatus.approved
        : ApprovalStatus.rejected;

      await this.prisma.$transaction(async (tx) => {
        await tx.driverRequest.update({
          where: { id: request_id },
          data: {
            status: newStatus,
            admin_notes: admin_notes ?? null,
            approved_by: admin_id,
          },
        });

        if (approved) {
          await tx.user.update({
            where: { id: request.user_id },
            data: {
              role: UserRole.driver,
              driver_status: 'approved',
            },
          });
        } else {
          await tx.user.update({
            where: { id: request.user_id },
            data: { driver_status: 'rejected' },
          });
        }
      });

      return {
        id: request.id,
        status: newStatus,
        user_notes: request.user_notes,
        admin_notes: admin_notes ?? null,
        created_at: request.created_at,
        approved_by: admin_id,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }
}
