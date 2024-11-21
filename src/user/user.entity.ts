import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role';
import { IsOptional } from 'class-validator';

@Entity('User')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  name: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty({ description: 'The role of the user', enum: Role })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  @IsOptional()
  authority_group: Role;

  @Column({ type: 'int', default: 0 })
  available_pages: number;
}

export class UserSimple extends PickType(User, [
  'id',
  'name',
  'available_pages',
]) {}
