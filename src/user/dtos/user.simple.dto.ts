import { PickType } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserSimpleDto extends PickType(User, [
  'name',
  'available_pages',
] as const) {}
