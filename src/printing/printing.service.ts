import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import 'dotenv/config';
import { Printer } from './printing.entity';
import { PrinterCreateDto } from './dtos/printerDtos/printer.create.dto';
import { PrinterSearchDto } from './dtos/printerDtos/printer.search.dto';

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
}
