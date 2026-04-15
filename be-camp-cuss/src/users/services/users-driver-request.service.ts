import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ApprovalStatus, isDriver, Role } from '../../common/enums/user.enum';
import { PrismaService } from '../../prisma/prisma.services';
import { CreateDriverRequest } from '../dto/create-driver-request.dto';
import { ApproveDriverRequestDto } from '../dto/approve-driver-request.dto';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { MetaResponse } from '../../common/types/api-response.interface';
import { DriverRequestResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UsersDriverRequestService {
  private readonly context = UsersDriverRequestService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async createDriverRequest(
    userId: number,
    dto: CreateDriverRequest,
  ): Promise<DriverRequestResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(
          `Pengguna dengan ID ${userId} tidak ditemukan saat mengajukan permintaan driver`,
          this.context,
        );

        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      if (isDriver(user.role as Role)) {
        this.logger.warn(
          `Pengguna dengan ID ${userId} sudah menjadi driver`,
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
          `Dokumen belum lengkap untuk user ID ${userId} saat mengajukan permintaan driver`,
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
          user_id: userId,
          status: { in: [ApprovalStatus.Pending, ApprovalStatus.Approved] },
        },
      });

      if (activeRequest) {
        const message =
          (activeRequest.status as ApprovalStatus) === ApprovalStatus.Pending
            ? 'Permintaan kamu sedang diproses, silakan tunggu persetujuan admin'
            : 'Kamu sudah terdaftar sebagai driver';

        this.logger.warn(
          `Permintaan driver aktif sudah ada untuk user ID ${userId} dengan status ${activeRequest.status}`,
          this.context,
        );

        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      const createdRequest = await this.prisma.driverRequest.create({
        data: { user_id: userId, user_notes: dto.user_notes ?? null },
        select: {
          id: true,
          user_id: true,
          status: true,
          user_notes: true,
          admin_notes: true,
          approved_by: true,
          user: true,
        },
      });

      this.logger.log(
        `Permintaan driver berhasil dibuat untuk user ID ${userId} dengan request ID ${createdRequest.id}`,
        this.context,
      );

      const response: DriverRequestResponseDto = {
        driverRequestId: createdRequest.id,
        userId: createdRequest.user_id,
        status: createdRequest.status as ApprovalStatus,
        userNotes: createdRequest.user_notes,
        adminNotes: createdRequest.admin_notes,
        approvedBy: createdRequest.approved_by,
        ...createdRequest.user,
        role: createdRequest.user.role as Role,
      };

      return response;
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
  ): Promise<{ data: DriverRequestResponseDto[]; meta: MetaResponse }> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        this.prisma.driverRequest.findMany({
          where: {
            status: ApprovalStatus.Pending,
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
            status: ApprovalStatus.Pending,
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

      const data: DriverRequestResponseDto[] = requests.map((req) => ({
        id: req.id,
        created_at: req.created_at,
        driverRequestId: req.id,
        userId: req.user_id,
        status: req.status as ApprovalStatus,
        userNotes: req.user_notes,
        adminNotes: req.admin_notes,
        approvedBy: req.approved_by,
        driverRequestCreatedAt: req.created_at,
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          npm: req.user.npm,
          no_phone: req.user.no_phone,
        },
      }));

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
    requestId: number,
    adminId: number,
    dto: ApproveDriverRequestDto,
  ): Promise<DriverRequestResponseDto> {
    try {
      const { approved, admin_notes } = dto;

      const request = await this.prisma.driverRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        this.logger.warn(
          `Permintaan driver dengan ID ${requestId} tidak ditemukan`,
          this.context,
        );

        throw new HttpException(
          'Permintaan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        (request.status as ApprovalStatus) !== ApprovalStatus.Pending ||
        request.approved_by !== null
      ) {
        this.logger.warn(
          `Permintaan driver dengan ID ${requestId} sudah diproses sebelumnya`,
          this.context,
        );

        throw new HttpException(
          'Permintaan ini sudah diproses',
          HttpStatus.CONFLICT,
        );
      }

      const newStatus = approved
        ? ApprovalStatus.Approved
        : ApprovalStatus.Rejected;

      await this.prisma.$transaction(async (tx) => {
        await tx.driverRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus,
            admin_notes: admin_notes ?? null,
            approved_by: adminId,
          },
        });

        if (approved) {
          await tx.user.update({
            where: { id: request.user_id },
            data: {
              role: Role.Driver,
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
        `Permintaan driver dengan ID ${requestId} telah ${newStatus === ApprovalStatus.Approved ? 'disetujui' : 'ditolak'} oleh admin ID ${adminId}`,
        this.context,
      );

      // Ambil data permintaan driver yang sudah diperbarui
      const updatedRequest = await this.prisma.driverRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!updatedRequest) {
        throw new HttpException(
          'Permintaan tidak ditemukan setelah update',
          HttpStatus.NOT_FOUND,
        );
      }

      const response: DriverRequestResponseDto = {
        driverRequestId: updatedRequest.id,
        userId: updatedRequest.user_id,
        status: updatedRequest.status as ApprovalStatus,
        userNotes: updatedRequest.user_notes,
        adminNotes: updatedRequest.admin_notes,
        approvedBy: updatedRequest.approved_by,
        ...updatedRequest.user,
        role: updatedRequest.user.role as Role,
      };

      return response;
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
