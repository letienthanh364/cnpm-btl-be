import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import 'dotenv/config';
import { Printer, PrinterSimple, PrintJob } from './printing.entity';
import { PrinterCreateDto } from './dtos/printerDtos/printer.create.dto';
import { PrinterSearchDto } from './dtos/printerDtos/printer.search.dto';
import { PrintJobCreateDto } from './dtos/printjobDtos/printjob.create.dto';
import { PrintJobSearchDto } from './dtos/printjobDtos/printjob.search.dto';
import { User, UserSimple } from 'src/user/user.entity';
import { File, Filesimple } from 'src/file/file.entity';
import { PrinterStatus } from 'src/common/decorator/printer_status';
import { calculateNumPages } from 'src/common/printing/printing.utils';
import { PrintConfig } from 'src/common/printing/printing.config';
import { NotifyService } from 'src/notify/notify.service';
import { NotifyPrintjobCreateDto } from 'src/notify/dtos/notify.create.dto';
import { AppService } from 'src/app.service';
import { PrinterUpdateDto } from './dtos/printerDtos/printer.update.dtp';

@Injectable()
export class PrinterService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Printer)
    private readonly printerRepo: Repository<Printer>,
    private readonly dataSource: DataSource,
    private readonly notifyService: NotifyService,
    private readonly appService: AppService,
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

  async update(
    printerId: string, // The printer ID you want to update
    printerCreateDto: PrinterUpdateDto, // The data for the update
  ): Promise<Printer> {
    const printer = await this.printerRepo.findOne({
      where: { id: printerId },
    });

    if (!printer) {
      throw new NotFoundException(`Printer with ID ${printerId} not found`);
    }

    Object.assign(printer, printerCreateDto);

    try {
      const updatedPrinter = await this.printerRepo.save(printer);
      return updatedPrinter;
    } catch (error) {
      throw new BadRequestException('Failed to update printer');
    }
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
      throw new BadRequestException(`Printer with ID ${printerId} not found`);
    }

    if (printer.status === PrinterStatus.InMaintain) {
      throw new BadRequestException(
        'The selected printer is currently unavailable',
      );
    }

    // Add the new job to the queue
    const positionInQueue = printer.printjob_queue.length;
    printer.printjob_queue.push(printJob.id);

    // If the printer is available, mark it as busy before processing starts
    if (printer.status === PrinterStatus.Available) {
      printer.status = PrinterStatus.Busy;
    }

    // Save the updated printer entity
    await this.printerRepo.save(printer);

    // Simplify the printer response
    const printerSimple: PrinterSimple = {
      id: printer.id,
      printer_code: printer.printer_code,
      location: printer.location,
      status: printer.status,
      printjob_queue: printer.printjob_queue,
    };

    // Build the response
    const { printer: _, ...resPrinjob } = printJob;
    const response = {
      message: 'success',
      printJob: resPrinjob,
      position: positionInQueue,
      printer: printerSimple,
    };

    // Start processing the queue if not already processing
    if (printer.status === PrinterStatus.Busy && positionInQueue === 0) {
      this.startProcessingQueue(printerId);
    }

    return response;
  }

  // ! Automatically start processing queues for all printers
  async onApplicationBootstrap() {
    const printers = await this.printerRepo.find();
    printers.forEach((printer) => {
      this.startProcessingQueue(printer.id); // Start queue processing for each printer
    });
  }

  // ! Function to simulate print job processing
  async startProcessingQueue(printerId: string) {
    // Use a flag to ensure only one processing loop per printer
    const processQueue = async () => {
      let isProcessing = true;

      while (isProcessing) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        try {
          await queryRunner.startTransaction();

          // Fetch the printer and lock for processing
          const updatedPrinter = await queryRunner.manager.findOne(Printer, {
            where: { id: printerId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!updatedPrinter || updatedPrinter.printjob_queue.length === 0) {
            // No jobs left; mark as available
            if (updatedPrinter) {
              updatedPrinter.status = PrinterStatus.Available;
              await queryRunner.manager.save(updatedPrinter);
            }
            isProcessing = false; // Stop processing if the queue is empty
            await queryRunner.commitTransaction();
            break;
          }

          // Get the next job to process
          const nextJobId = updatedPrinter.printjob_queue[0];
          const printJob = await queryRunner.manager.findOne(PrintJob, {
            where: { id: nextJobId },
            relations: ['file', 'user', 'printer'],
          });

          if (!printJob) {
            // If the print job is missing, remove it from the queue
            updatedPrinter.printjob_queue.shift();
            await queryRunner.manager.save(updatedPrinter);
            await queryRunner.commitTransaction();
            continue;
          }

          // Simulate processing
          console.log(
            `Printer ${updatedPrinter.printer_code} is printing ${printJob.file.name}`,
          );

          const processingTime =
            printJob.num_pages *
            this.appService.getPrintingTimePerPaper() *
            1000;

          // Commit the transaction before simulating processing
          await queryRunner.commitTransaction();

          await new Promise((resolve) => setTimeout(resolve, processingTime));

          // ? Remove the job from the queue and update the status
          const queryRunner2 = this.dataSource.createQueryRunner();
          await queryRunner2.connect();
          await queryRunner2.startTransaction();

          const refreshedPrinter = await queryRunner2.manager.findOne(Printer, {
            where: { id: printerId },
            lock: { mode: 'pessimistic_write' },
          });

          if (refreshedPrinter) {
            refreshedPrinter.printjob_queue.shift();
            refreshedPrinter.status =
              refreshedPrinter.printjob_queue.length === 0
                ? PrinterStatus.Available
                : PrinterStatus.Busy;

            await queryRunner2.manager.save(refreshedPrinter);

            console.log(
              `Printer ${refreshedPrinter.printer_code} printed ${printJob.file.name} successfully`,
            );
          }

          await queryRunner2.commitTransaction();

          // ? Notify the user
          const notifyPrintjob: NotifyPrintjobCreateDto = {
            message: `Your document ${printJob.file.name} is printed by printer at ${printJob.printer.location}`,
            receiver_ids: [printJob.user.id],
            printjob_id: printJob.id,
            type: 'notify',
          };
          await this.notifyService.createPrintjobNotification(notifyPrintjob);
        } catch (error) {
          console.error('Error processing queue:', error.message);
          await queryRunner.rollbackTransaction();
        } finally {
          await queryRunner.release();
        }
      }
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
    const userSimple: UserSimple = {
      id: user.id,
      name: user.name,
      available_pages: user.available_pages,
    };

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
    const fileSimple: Filesimple = {
      id: file.id,
      name: file.name,
      total_pages: file.total_pages,
      mimeType: file.mimeType,
      path: file.path,
    };

    const numPages = calculateNumPages(
      file.total_pages,
      printjob.page_size,
      printjob.duplex,
      printjob.copies,
    );

    if (user.available_pages < numPages) {
      throw new BadRequestException(
        `available pages not enough for required pages (${user.available_pages} compare to ${numPages})`,
      );
    }

    user.available_pages = user.available_pages - numPages;

    await this.userRepo.save(user);

    const newPrintjob = await this.printjobRepo.save({
      page_size: printjob.page_size ?? PrintConfig.printingStadarSize,
      duplex: printjob.duplex ?? true,
      num_pages: numPages,
      file: file,
      user: user,
      printer: printer,
    });

    return {
      ...newPrintjob,
      file: fileSimple,
      user: userSimple,
      printer: printer,
    };
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
