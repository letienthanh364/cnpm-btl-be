import { PickType } from '@nestjs/swagger';
import { Notify } from '../notify.entity';

export class NotifyCreateDto extends PickType(Notify, ['type', 'message']) {
  receiver_ids: string[];
}

export class NotifyPrintjobCreateDto extends PickType(Notify, [
  'type',
  'message',
]) {
  receiver_ids: string[];
  printjob_id: string;
}
