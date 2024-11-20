import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { PrintJobStatus } from 'src/common/decorator/printjob_status';

export class PrintJobSearchDto {
  @IsOptional()
  @IsUUID()
  file_id?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsUUID()
  printer_id?: string;

  @IsOptional()
  print_status?: PrintJobStatus;

  @IsOptional()
  @IsArray()
  date?: string[];
}
