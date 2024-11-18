import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PrinterService } from './printing.service';
import { PrinterCreateDto } from './dtos/printerDtos/printer.create.dto';
import { Printer } from './printing.entity';
import { PrinterSearchDto } from './dtos/printerDtos/printer.search.dto';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('')
  async createPrinters(@Body() printers: PrinterCreateDto[]) {
    console.log(printers);
    return this.printerService.createPrinters(printers);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Printer> {
    const printer = await this.printerService.findOne(id);
    if (!printer) {
      throw new NotFoundException('printer record not found');
    }
    return printer;
  }

  @Get('')
  async search(
    @Query('location') location?: string,
    @Query('code') printerCode?: string,
  ): Promise<Printer[]> {
    const searchDto: PrinterSearchDto = {
      location: location,
      printer_code: printerCode,
    };

    return this.printerService.search(searchDto);
  }
}
