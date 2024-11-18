import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ObjectIdColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class BaseEntity {
  // @ObjectIdColumn() // Primary key for MongoDB
  // _id: string;

  @ApiProperty({
    description: 'The unique identifier for the entity',
    example: 'c9b1d0ae-d6f7-11ea-87d0-0242ac130003',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The date when the entity was created',
    example: '2023-01-01T12:00:00Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'The date when the entity was deleted',
    example: '2023-01-02T12:00:00Z',
  })
  @DeleteDateColumn()
  deleted_at: Date;

  @ApiProperty({
    description: 'The date when the entity was last updated',
    example: '2023-01-02T12:00:00Z',
  })
  @UpdateDateColumn()
  updated_at: Date;
}
