import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role';
import { IsOptional } from 'class-validator';
import { User } from 'src/user/user.entity';
import { Optional } from '@nestjs/common';
import { PrintJob } from 'src/printing/printing.entity';

@Entity('Notification')
export class Notify extends BaseEntity {
  @Column({
    type: 'varchar',
    default: 'notify',
  })
  type: string;

  @Column({ type: 'varchar' })
  message: string;

  @ManyToMany(() => User)
  @JoinTable()
  receivers: User[];

  @ManyToOne(() => PrintJob, { nullable: true }) // Define the Many-to-One relationship
  printjob: PrintJob; // Links to a single PrintJob entity
}
