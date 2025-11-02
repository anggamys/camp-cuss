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
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('destinations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  async create(@Body() dto: CreateDestinationDto) {
    const destination = await this.destinationsService.create(dto);

    return {
      message: 'Destinasi berhasil dibuat',
      data: destination,
    };
  }

  @Get()
  async findAll() {
    const destinations = await this.destinationsService.findAll();

    return {
      message: 'Destinasi berhasil diambil',
      data: destinations,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const destination = await this.destinationsService.findOne(+id);

    return {
      message: 'Destinasi berhasil diambil',
      data: destination,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDestinationDto) {
    const updated = await this.destinationsService.update({ ...dto, id: +id });

    return {
      message: 'Destinasi berhasil diperbarui',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.destinationsService.remove(+id);

    return {
      message: 'Destinasi berhasil dihapus',
      data: result,
    };
  }
}
