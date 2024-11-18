import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { IsOptional } from 'class-validator';
import { PrinterStatus } from 'src/common/decorator/printer_status';
import { PrintJobStatus } from 'src/common/decorator/printjob_status';
import { File } from 'src/file/file.entity';
import { User } from 'src/user/user.entity';

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
}

@Entity('PrintJob')
export class PrintJob extends BaseEntity {
  // Foreign key for File
  @ManyToOne(() => File, { nullable: false, onDelete: 'RESTRICT' }) // Relation to File entity
  @JoinColumn({ name: 'file_id', referencedColumnName: 'id' }) // Column name in PrintJob table
  file: File;

  // Foreign key for User
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' }) // Relation to User entity
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' }) // Column name in PrintJob table
  user: User;

  @ManyToOne(() => Printer, { nullable: false, onDelete: 'RESTRICT' }) // Relation to User entity
  @JoinColumn({ name: 'printer_id', referencedColumnName: 'id' }) // Column name in PrintJob table
  printer: Printer;

  @Column({ type: 'int', array: true })
  page_size: number[];

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
