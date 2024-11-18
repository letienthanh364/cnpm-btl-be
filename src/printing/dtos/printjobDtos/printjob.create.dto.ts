import { PickType } from '@nestjs/swagger';
import { PrintJob } from 'src/printing/printing.entity';

export class PrintJobCreateDto extends PickType(PrintJob, [
  'num_pages',
  'duplex',
  'page_size',
] as const) {
  file_id: string;
  user_id: string;
  printer_id: string;
}
