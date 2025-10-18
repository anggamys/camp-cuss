import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  async create(@Body() createDestinationDto: CreateDestinationDto) {
    const destination =
      await this.destinationsService.create(createDestinationDto);
    return { message: 'Destinasi berhasil dibuat', data: destination };
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
  async update(
    @Param('id') id: string,
    @Body() updateDestinationDto: UpdateDestinationDto,
  ) {
    const updatedDestination = await this.destinationsService.update({
      ...updateDestinationDto,
      id: +id,
    });

    return {
      message: 'Destinasi berhasil diperbarui',
      data: updatedDestination,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.destinationsService.remove(+id);
    return { message: 'Destinasi berhasil dihapus', data: result };
  }
}
