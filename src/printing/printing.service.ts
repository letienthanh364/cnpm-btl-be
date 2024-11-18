import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import 'dotenv/config';
import { Printer, PrintJob } from './printing.entity';
import { PrinterCreateDto } from './dtos/printerDtos/printer.create.dto';
import { PrinterSearchDto } from './dtos/printerDtos/printer.search.dto';
import { PrintJobCreateDto } from './dtos/printjobDtos/printjob.create.dto';
import { PrintJobSearchDto } from './dtos/printjobDtos/printjob.search.dto';
import { User } from 'src/user/user.entity';
import { File } from 'src/file/file.entity';
import { PrinterStatus } from 'src/common/decorator/printer_status';
import { calculateNumPages } from 'src/common/printing/printing.utils';

@Injectable()
export class PrinterService {
  constructor(
    @InjectRepository(Printer)
    private readonly printerRepo: Repository<Printer>,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<Printer> {
    return this.printerRepo.findOneBy({ id });
  }

  async search(data: PrinterSearchDto): Promise<Printer[]> {
    if (data.location) {
      return this.printerRepo.find({ where: { location: data.location } });
    }

    return this.printerRepo.find();
  }

  // ! Create multiple printers
  async createPrinters(printers: PrinterCreateDto[]): Promise<Printer[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newPrinters = queryRunner.manager.create(Printer, printers);

      const printerPromises = newPrinters.map(async (printer) => {
        let existingPrinter = await this.printerRepo.findOne({
          where: {
            printer_code: printer.printer_code,
          },
        });

        if (existingPrinter) {
          throw new BadRequestException('Printer already exists');
        }
      });

      await Promise.all(printerPromises);

      await queryRunner.manager.save(Printer, newPrinters);

      await queryRunner.commitTransaction();

      return newPrinters;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // ! Add printjob to queue
  async enqueuePrintJob(printJob: PrintJob, printerId: string) {
    const printer = await this.printerRepo.findOne({
      where: { id: printerId },
    });
    if (!printer) {
      throw new BadRequestException(`printer with id ${printerId} not found`);
    }

    if (printer.status == PrinterStatus.InMaintain) {
      throw new BadRequestException(
        'selected printer is in unavailable for now',
      );
    }

    const positionInQueue = printer.printjob_queue.length;
    printer.printjob_queue.push(printJob.id);
    printer.status = PrinterStatus.Busy;

    await this.printerRepo.save(printer);

    const { printer: _, ...resPrinjob } = printJob;

    return {
      message: 'success',
      printJob: resPrinjob,
      printer: printer,
      position: positionInQueue,
    };
  }

  async dequeuePrintJob(printJob: PrintJob, printerId: string) {
    const printer = await this.printerRepo.findOne({
      where: { id: printerId },
    });
    if (!printer) {
      throw new BadRequestException(`printer with id ${printerId} not found`);
    }

    if (printer.printjob_queue.length == 0) {
      throw new BadRequestException('the printer is having no printjob');
    }

    if (!printer.printjob_queue.includes(printJob.id)) {
      throw new BadRequestException(
        `printjob with id ${printJob.id} is not assigned to this printer`,
      );
    }

    printer.printjob_queue = printer.printjob_queue.filter(
      (jobId) => jobId != printJob.id,
    );
    if (printer.printjob_queue.length == 0) {
      printer.status = PrinterStatus.Available;
    }

    await this.printerRepo.save(printer);
    return {
      message: 'printjob is dequeued from printer',
      printer: printer,
    };
  }
}

export class PrintJobService {
  constructor(
    @InjectRepository(PrintJob)
    private readonly printjobRepo: Repository<PrintJob>,

    @InjectRepository(Printer)
    private readonly printerRepo: Repository<Printer>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  async createPrintJob(printjob: PrintJobCreateDto): Promise<PrintJob> {
    const user = await this.userRepo.findOne({
      where: { id: printjob.user_id },
    });
    if (!user) {
      throw new BadRequestException(
        `user with id ${printjob.user_id} not found`,
      );
    }

    const printer = await this.printerRepo.findOne({
      where: { id: printjob.printer_id },
    });
    if (!printer) {
      throw new BadRequestException(
        `printer with id ${printjob.printer_id} not found`,
      );
    }

    const file = await this.fileRepo.findOne({
      where: { id: printjob.file_id },
    });
    if (!file) {
      throw new BadRequestException(
        `file with id ${printjob.file_id} not found`,
      );
    }

    const numPages = calculateNumPages(
      file.total_pages,
      printjob.page_size,
      printjob.duplex,
    );

    return this.printjobRepo.save({
      page_size: printjob.page_size,
      duplex: printjob.duplex,
      num_pages: numPages,
      file: file,
      user: user,
      printer: printer,
    });
  }

  async findOne(id: string): Promise<PrintJob> {
    const printJob = await this.printjobRepo.findOne({
      where: { id: id },
      relations: ['file', 'user', 'printer'],
    });

    if (!printJob) {
      throw new BadRequestException(`printjob with id ${id} not found`);
    }
    return printJob;
  }

  async search(data: PrintJobSearchDto): Promise<PrintJob[]> {
    const query = this.printjobRepo.createQueryBuilder('printJob');

    query
      .leftJoinAndSelect('printJob.file', 'file')
      .leftJoinAndSelect('printJob.user', 'user')
      .leftJoinAndSelect('printJob.printer', 'printer');

    // Add filters dynamically based on the query DTO
    if (data.user_id) {
      query.andWhere('printJob.user.id = :user_id', { user_id: data.user_id });
    }

    if (data.printer_id) {
      query.andWhere('printJob.printer.id = :printer_id', {
        printer_id: data.printer_id,
      });
    }

    if (data.file_id) {
      query.andWhere('printJob.file.id = :file_id', { file_id: data.file_id });
    }

    if (data.print_status !== undefined) {
      query.andWhere('printJob.print_status = :print_status', {
        print_status: data.print_status,
      });
    }

    // Execute the query and return results
    return query.getMany();
  }
}
