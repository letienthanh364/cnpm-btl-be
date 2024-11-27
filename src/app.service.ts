import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private printingTimePerPaper: number = 2;
  private pricePerPaper: number = 5;
  private allowedFiles: string[] = ['pdf', 'txt', 'doc', 'png'];

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
}
