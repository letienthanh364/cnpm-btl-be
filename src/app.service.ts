import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notify } from './notify/notify.entity';
import { PrintJob } from './printing/printing.entity';

@Injectable()
export class AppService {
  private printingTimePerPaper: number = 2;
  private pricePerPaper: number = 5;
  private allowedFiles: string[] = ['pdf', 'txt', 'doc', 'png'];

  constructor(
    @InjectRepository(PrintJob)
    private readonly printjobRepo: Repository<PrintJob>,

    @InjectRepository(Notify)
    private readonly notifyRepo: Repository<Notify>,
  ) {}

  // Getter for printingTimePerPaper
  getPrintingTimePerPaper(): number {
    return this.printingTimePerPaper;
  }

  // Getter for pricePerPaper
  getPricePerPaper(): number {
    return this.pricePerPaper;
  }

  // Getter for allowedFiles
  getAllowedFiles(): string[] {
    return this.allowedFiles;
  }

  // Setter for printingTimePerPaper
  setPrintingTimePerPaper(value: number): void {
    if (value > 0) {
      this.printingTimePerPaper = value;
    } else {
      throw new Error('Printing time must be a positive number.');
    }
  }

  // Setter for pricePerPaper
  setPricePerPaper(value: number): void {
    if (value > 0) {
      this.pricePerPaper = value;
    } else {
      throw new Error('Price per paper must be a positive number.');
    }
  }

  // Setter for allowedFiles
  setAllowedFiles(files: string[]): void {
    if (files.length > 0 && files.every((file) => typeof file === 'string')) {
      files.forEach((file) => {
        if (!this.allowedFiles.includes(file)) {
          this.allowedFiles.push(file);
        }
      });
    } else {
      throw new Error('Allowed files must be a non-empty array of strings.');
    }
  }

  // Getter for all values
  getAllConfig(): {
    printingTimePerPaper: number;
    pricePerPaper: number;
    allowedFiles: string[];
  } {
    return {
      printingTimePerPaper: this.printingTimePerPaper,
      pricePerPaper: this.pricePerPaper,
      allowedFiles: this.allowedFiles,
    };
  }

  async generateReport(): Promise<any> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0); // Start of the current month

    // Get all print jobs since the beginning of the month
    const printJobs = await this.printjobRepo
      .createQueryBuilder('printjob')
      .leftJoin('printjob.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .leftJoin('printjob.printer', 'printer')
      .addSelect(['printer.id', 'printer.location', 'printer.printer_code'])
      .where('printjob.created_at >= :startOfMonth', { startOfMonth })
      .getMany();

    // Calculate total printed pages and how many pages each user has used
    let totalPrintedPages = 0;
    const userPageUsage = new Map<
      string,
      { name: string; used_pages: number }
    >(); // Map to store pages used by each user along with their username

    printJobs.forEach((printJob) => {
      totalPrintedPages += printJob.num_pages;

      const userId = printJob.user.id;
      const userName = printJob.user.name; // Assuming 'name' is the username field

      if (userPageUsage.has(userId)) {
        userPageUsage.set(userId, {
          name: userName, // Keep the username the same
          used_pages:
            userPageUsage.get(userId)!.used_pages + printJob.num_pages, // Add pages to the existing usage
        });
      } else {
        userPageUsage.set(userId, {
          name: userName,
          used_pages: printJob.num_pages,
        });
      }
    });

    // Get notifications where printjob is null (i.e., notifications related to print jobs that don't exist)
    const notifications = await this.notifyRepo
      .createQueryBuilder('notification')
      .where('notification.printjob IS NULL')
      .andWhere('notification.created_at >= :startOfMonth', { startOfMonth })
      .select([
        'notification.id',
        'notification.created_at',
        'notification.message',
      ])
      .getMany();

    return {
      total_printed_pages: totalPrintedPages,
      printjobs: printJobs,
      user_page_usage: userPageUsage,
      notifications: notifications,
      start_date: startOfMonth,
      end_date: new Date(),
    };
  }
}
