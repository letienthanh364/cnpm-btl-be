import { PickType } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/base_entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('File')
export class File extends BaseEntity {
  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int', default: 1 })
  total_pages: number;

  @Column()
  path: string; // Store the file path
}

export class Filesimple extends PickType(File, [
  'id',
  'name',
  'mimeType',
  'total_pages',
  'path',
]) {}
