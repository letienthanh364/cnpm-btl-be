import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrinterService, PrintJobService } from './printing.service';
import { PrinterCreateDto } from './dtos/printerDtos/printer.create.dto';
import { Printer, PrintJob } from './printing.entity';
import { PrinterSearchDto } from './dtos/printerDtos/printer.search.dto';
import { PrintJobCreateDto } from './dtos/printjobDtos/printjob.create.dto';
import { PrintJobStatus } from 'src/common/decorator/printjob_status';
import { PrintJobSearchDto } from './dtos/printjobDtos/printjob.search.dto';
import { PrinterUpdateDto } from './dtos/printerDtos/printer.update.dtp';
import { AdminGuard, JwtAuthGuard } from 'src/common/auth/strategy';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('')
  async createPrinters(@Body() printers: PrinterCreateDto[]) {
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

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() printerData: PrinterUpdateDto,
  ): Promise<Printer> {
    return this.printerService.update(id, printerData);
  }
}

@Controller('printjob')
export class PrintJobController {
  constructor(
    private readonly printJobService: PrintJobService,
    private readonly printerService: PrinterService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('')
  async create(@Body() printjob: PrintJobCreateDto) {
    const newPrintJob = await this.printJobService.createPrintJob(printjob);
    return this.printerService.enqueuePrintJob(
      newPrintJob,
      printjob.printer_id,
    );
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
    @Query('date') date?: string[],
  ): Promise<PrintJob[]> {
    const searchDto: PrintJobSearchDto = {
      user_id: userId,
      file_id: fileId,
      printer_id: printerId,
      print_status: printStatus,
      date: date,
    };

    return this.printJobService.search(searchDto);
  }
}
