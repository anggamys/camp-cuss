import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { UserRole, ApprovalStatus } from '@prisma/client';
import {
  CreateDriverRequest,
  ResponseCreateRequestDriverDto,
} from '../dto/create-driver-request.dto';
import {
  ApproveDriverRequestDto,
  ResponseApproveDriverRequestDto,
} from '../dto/approve-driver-request.dto';
import { DriverRequestItemDto } from '../dto/list-driver-requests.dto';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { MetaResponse } from '../../common/types/api-response.interface';
import { PrismaHelper } from '../../common/helpers/prisma.helper';

@Injectable()
export class UsersDriverRequestService {
  private readonly context = UsersDriverRequestService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaHelper: PrismaHelper,
    private readonly logger: AppLoggerService,
  ) {}

  async createDriverRequest(
    user_id: number,
    dto: CreateDriverRequest,
  ): Promise<ResponseCreateRequestDriverDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });
      if (!user) {
        this.logger.warn(
          `Pengguna dengan ID ${user_id} tidak ditemukan saat mengajukan permintaan driver`,
          this.context,
        );
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      if (user.role === UserRole.driver) {
        this.logger.warn(
          `Pengguna dengan ID ${user_id} sudah menjadi driver`,
          this.context,
        );
        throw new HttpException(
          'Kamu sudah terdaftar sebagai driver',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validasi kelengkapan data penting
      const required = [
        user.photo_profile,
        user.photo_id_card,
        user.photo_student_card,
        user.photo_driving_license,
      ];
      if (required.some((x) => !x)) {
        this.logger.warn(
          `Dokumen belum lengkap untuk user ID ${user_id}`,
          this.context,
        );

        throw new HttpException(
          'Silakan lengkapi semua dokumen yang dibutuhkan sebelum mengajukan permintaan driver',
          HttpStatus.BAD_REQUEST,
        );
      }

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
            ? 'Permintaan kamu sedang diproses, silakan tunggu persetujuan admin'
            : 'Kamu sudah terdaftar sebagai driver';
        this.logger.warn(
          `Permintaan driver aktif sudah ada untuk user ID ${user_id} dengan status ${activeRequest.status}`,
          this.context,
        );
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

      this.logger.log(
        `Permintaan driver berhasil dibuat untuk user ID ${user_id} dengan request ID ${createdRequest.id}`,
        this.context,
      );

      return createdRequest;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal membuat permintaan driver. Silakan coba lagi.`,
      );
    }
  }

  async findAllDriverRequests(
    query: ApiQueryParams,
  ): Promise<{ data: DriverRequestItemDto[]; meta: MetaResponse }> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        this.prismaHelper.findAllRecords('driverRequest', {
          where: {
            status: ApprovalStatus.pending,
          },
          include: { user: true },
          orderBy: {
            [query.sortBy ?? 'created_at']: query.sortOrder ?? 'desc',
          },
          take: limit,
          skip: skip,
        }),
        this.prisma.driverRequest.count({
          where: {
            status: ApprovalStatus.pending,
          },
        }),
      ]);

      if (requests.length === 0) {
        this.logger.debug(
          'Belum ada permintaan driver yang menunggu persetujuan',
          this.context,
        );

        return {
          data: [],
          meta: { total: 0, page: 1, perPage: 0 },
        };
      }

      this.logger.debug(
        `Ditemukan ${requests.length} permintaan driver yang menunggu persetujuan`,
        this.context,
      );

      const data: DriverRequestItemDto[] = requests.map(
        (req: DriverRequestItemDto) => ({
          id: req.id,
          user: req.user,
          status: req.status,
          user_notes: req.user_notes,
          admin_notes: req.admin_notes,
          created_at: req.created_at,
        }),
      );

      const meta: MetaResponse = {
        total,
        page,
        last_page: Math.ceil(total / limit),
        per_page: limit,
      };

      return { data, meta };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal mengambil daftar permintaan driver',
      );
    }
  }

  async approveDriverRequest(
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

      if (!request) {
        this.logger.warn(
          `Permintaan driver dengan ID ${request_id} tidak ditemukan`,
          this.context,
        );
        throw new HttpException(
          'Permintaan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        request.status !== ApprovalStatus.pending ||
        request.approved_by !== null
      ) {
        this.logger.warn(
          `Permintaan driver dengan ID ${request_id} sudah diproses sebelumnya`,
          this.context,
        );
        throw new HttpException(
          'Permintaan ini sudah diproses',
          HttpStatus.CONFLICT,
        );
      }

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

      this.logger.log(
        `Permintaan driver dengan ID ${request_id} telah ${newStatus === ApprovalStatus.approved ? 'disetujui' : 'ditolak'} oleh admin ID ${admin_id}`,
        this.context,
      );

      return {
        id: request.id,
        status: newStatus,
        user_notes: request.user_notes,
        admin_notes: admin_notes ?? null,
        created_at: request.created_at,
        approved_by: admin_id,
      };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal memproses permintaan driver. Silakan coba lagi.`,
      );
    }
  }
}
