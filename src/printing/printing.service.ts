import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
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
import { PrintConfig } from 'src/common/printing/printing.config';
import { NotifyService } from 'src/notify/notify.service';
import { NotifyPrintjobCreateDto } from 'src/notify/dtos/notify.create.dto';

@Injectable()
export class PrinterService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Printer)
    private readonly printerRepo: Repository<Printer>,
    private readonly dataSource: DataSource,
    private readonly notifyService: NotifyService,
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

    await this.printerRepo.save(printer);

    const { printer: _, ...resPrinjob } = printJob;

    const response = {
      message: 'success',
      printJob: resPrinjob,
      position: positionInQueue,
      printer: printer,
    };

    if (printer.status === PrinterStatus.Available) {
      this.startProcessingQueue(printer);
    }

    return response;
  }

  // ! Automatically start processing queues for all printers
  async onApplicationBootstrap() {
    const printers = await this.printerRepo.find();
    printers.forEach((printer) => {
      this.startProcessingQueue(printer); // Start queue processing for each printer
    });
  }

  // ! Function to simulate print job processing
  async startProcessingQueue(printer: Printer) {
    // Continuously process the print job queue
    const processQueue = async () => {
      if (printer.printjob_queue.length === 0) {
        printer.status = PrinterStatus.Available;
        await this.printerRepo.save(printer);
        return; // Stop processing if queue is empty
      }

      printer.status = PrinterStatus.Busy;

      // Get the next print job in the queue
      const nextJobId = printer.printjob_queue[0];
      const printJob = await this.dataSource.getRepository(PrintJob).findOne({
        where: { id: nextJobId },
        relations: ['file', 'user', 'printer'],
      });

      if (!printJob) {
        // If the print job is missing, remove it from the queue
        printer.printjob_queue.shift();
        await this.printerRepo.save(printer);
        return processQueue();
      }

      // Simulate the printing process
      printer.status = PrinterStatus.Busy;
      await this.printerRepo.save(printer);

      console.log(
        `Printer ${printer.printer_code} is printing ${printJob.file.name}`,
      );

      // ? Simulate processing time using a Promise
      const processingTime =
        printJob.num_pages * PrintConfig.printingTimePerPage * 1000;

      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // Remove the job from the queue and save
      printer.printjob_queue.shift();
      await this.printerRepo.save(printer);

      console.log(
        `Printer ${printer.printer_code} printed ${printJob.file.name} successfully`,
      );

      // ? Notify the user
      const notifyPrintjob: NotifyPrintjobCreateDto = {
        message: `Your document ${printJob.file.name} is printed by printer at ${printJob.printer.location}`,
        receiver_ids: [printJob.user.id],
        printjob_id: printJob.id,
        type: 'notify',
      };
      await this.notifyService.createPrintjobNotification(notifyPrintjob);

      processQueue(); // Process the next job in the queue
    };

    processQueue(); // Start processing the queue
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
      page_size: printjob.page_size ?? PrintConfig.printingStadarSize,
      duplex: printjob.duplex ?? true,
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
    const query = this.printjobRepo.createQueryBuilder('printjob');

    query
      .leftJoinAndSelect('printjob.file', 'file')
      .leftJoinAndSelect('printjob.user', 'user')
      .leftJoinAndSelect('printjob.printer', 'printer');

    // Add filters dynamically based on the query DTO
    if (data.user_id) {
      query.andWhere('printjob.user.id = :user_id', { user_id: data.user_id });
    }

    if (data.printer_id) {
      query.andWhere('printjob.printer.id = :printer_id', {
        printer_id: data.printer_id,
      });
    }

    if (data.file_id) {
      query.andWhere('printjob.file.id = :file_id', { file_id: data.file_id });
    }

    if (data.print_status !== undefined) {
      query.andWhere('printjob.print_status = :print_status', {
        print_status: data.print_status,
      });
    }

    // Validate and convert date array to Date objects
    if (data.date && data.date.length === 2) {
      const [startDate, endDate] = data.date.map((date) => new Date(date));

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('printjob.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    // Execute the query and return results
    return query.getMany();
  }
}
