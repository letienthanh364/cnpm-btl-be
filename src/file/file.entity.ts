import { BaseEntity } from 'src/common/base_entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('file')
export class File extends BaseEntity {
  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column()
  path: string; // Store the file path
}
