import { PickType } from '@nestjs/swagger';
import { Notify } from '../notify.entity';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class NotifySearchDto extends PickType(Notify, ['type']) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Validate each element of the array as a string
  receiver_ids?: string[];

  @IsOptional()
  @IsString()
  printjob_id?: string;
}
