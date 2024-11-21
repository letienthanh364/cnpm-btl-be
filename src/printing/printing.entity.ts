import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { IsOptional } from 'class-validator';
import { PrinterStatus } from 'src/common/decorator/printer_status';
import { PrintJobStatus } from 'src/common/decorator/printjob_status';
import { File, Filesimple } from 'src/file/file.entity';
import { User, UserSimple } from 'src/user/user.entity';
import { PrintConfig } from 'src/common/printing/printing.config';
import { PickType } from '@nestjs/swagger';

@Entity('Printer')
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

  @Column({
    type: 'varchar',
    array: true,
    default: [],
  })
  printjob_queue: string[];
}

export class PrinterSimple extends PickType(Printer, [
  'id',
  'location',
  'printer_code',
  'status',
  'printjob_queue',
]) {}

@Entity('PrintJob')
export class PrintJob extends BaseEntity {
  // Foreign key for File
  @ManyToOne(() => File, { nullable: false, onDelete: 'RESTRICT' }) // Relation to File entity
  @JoinColumn({ name: 'file_id', referencedColumnName: 'id' }) // Column name in PrintJob table
  file: Filesimple;

  // Foreign key for User
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' }) // Relation to User entity
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' }) // Column name in PrintJob table
  user: UserSimple;

  @ManyToOne(() => Printer, { nullable: false, onDelete: 'RESTRICT' }) // Relation to User entity
  @JoinColumn({ name: 'printer_id', referencedColumnName: 'id' }) // Column name in PrintJob table
  printer: PrinterSimple;

  @Column({ type: 'int', array: true, default: PrintConfig.printingStadarSize })
  page_size: number[];

  @Column({ type: 'int', default: 1 })
  copies: number;

  @Column({ type: 'int' })
  num_pages: number;

  @Column({ type: 'boolean' })
  duplex: boolean;

  @Column({
    type: 'enum',
    enum: PrintJobStatus,
    default: PrintJobStatus.InQueue,
  })
  @IsOptional()
  print_status: PrintJobStatus;
}

export class PrintjobSimple extends PickType(PrintJob, [
  'id',
  'file',
  'copies',
  'duplex',
  'num_pages',
  'print_status',
]) {}
