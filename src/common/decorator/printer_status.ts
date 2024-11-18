import { SetMetadata } from '@nestjs/common';

export enum PrinterStatus {
  Busy = 'busy',
  Available = 'available',
  InMaintain = 'in_maintain',
}

export const PRINTER_STATUS_KEYS = 'printer_statuses';
export const PrinterStatuses = (...statuses: PrinterStatus[]) =>
  SetMetadata(PRINTER_STATUS_KEYS, statuses);
