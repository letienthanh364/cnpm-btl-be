import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base_entity';

@Entity('user')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  name: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar' })
  password: string;
}
