import { PickType } from '@nestjs/swagger';
import { Printer } from '../../printing.entity';

export class PrinterUpdateDto extends PickType(Printer, [
  'location',
  'printer_code',
  'status',
] as const) {}
