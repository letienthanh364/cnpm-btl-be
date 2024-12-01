import { SetMetadata } from '@nestjs/common';

export enum PrintJobStatus {
  InQueue = 'in_queue',
  Processing = 'processing',
  Complete = 'complete',
}

export const PRINJOB_STATUS_KEYS = 'printjob_statuses';
export const PrintJobStatuses = (...statuses: PrintJobStatus[]) =>
  SetMetadata(PRINJOB_STATUS_KEYS, statuses);
