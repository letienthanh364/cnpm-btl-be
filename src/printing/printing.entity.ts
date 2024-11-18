import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { IsOptional } from 'class-validator';
import { PrinterStatus } from 'src/common/decorator/printer_status';

@Entity('printer')
export class Printer extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  location: string;

  @Column({ type: 'varchar', unique: true })
  printer_code: string;

  @Column({
    type: 'enum',
    enum: PrinterStatus,
    default: PrinterStatus.Available,
  })
  @IsOptional()
  status: PrinterStatus;
}
