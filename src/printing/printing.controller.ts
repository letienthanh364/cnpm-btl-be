import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PrinterService, PrintJobService } from './printing.service';
import { PrinterCreateDto } from './dtos/printerDtos/printer.create.dto';
import { Printer, PrintJob } from './printing.entity';
import { PrinterSearchDto } from './dtos/printerDtos/printer.search.dto';
import { PrintJobCreateDto } from './dtos/printjobDtos/printjob.create.dto';
import { PrintJobStatus } from 'src/common/decorator/printjob_status';
import { PrintJobSearchDto } from './dtos/printjobDtos/printjob.search.dto';

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

@Controller('printjob')
export class PrintJobController {
  constructor(private readonly printJobService: PrintJobService) {}

  @Post('')
  async create(@Body() printjob: PrintJobCreateDto) {
    return this.printJobService.createPrintJob(printjob);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PrintJob> {
    return this.printJobService.findOne(id);
  }

  @Get('')
  async search(
    @Query('user_id') userId?: string,
    @Query('file_id') fileId?: string,
    @Query('printer_id') printerId?: string,
    @Query('print_status') printStatus?: PrintJobStatus,
  ): Promise<PrintJob[]> {
    const searchDto: PrintJobSearchDto = {
      user_id: userId,
      file_id: fileId,
      printer_id: printerId,
      print_status: printStatus,
    };

    return this.printJobService.search(searchDto);
  }
}
