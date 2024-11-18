import { PrintJobStatus } from 'src/common/decorator/printjob_status';

export class PrintJobSearchDto {
  file_id?: string;
  user_id?: string;
  printer_id?: string;
  print_status?: PrintJobStatus;
}
