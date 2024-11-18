import { PickType } from '@nestjs/swagger';
import { Printer } from '../../printing.entity';

export class PrinterCreateDto extends PickType(Printer, [
  'location',
  'printer_code',
] as const) {}
