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
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/user.enum';
import { ApiQueryParams } from '../common/types/api-request.interface';

@Controller('destinations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  async create(@Body() dto: CreateDestinationDto) {
    const data = await this.destinationsService.create(dto);
    return { message: 'Destinasi berhasil dibuat', data };
  }

  @Public()
  @Get()
  async getAll(@Query() query: ApiQueryParams) {
    const { data, meta } = await this.destinationsService.getAll(query);

    return {
      message: 'Daftar destinasi berhasil diambil',
      data,
      meta,
    };
  }

  @Public()
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.destinationsService.getById(Number(id));

    return { message: 'Detail destinasi berhasil diambil', data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDestinationDto) {
    const data = await this.destinationsService.update(Number(id), dto);

    return { message: 'Destinasi berhasil diperbarui', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const message = await this.destinationsService.delete(Number(id));

    return { message };
  }
}
