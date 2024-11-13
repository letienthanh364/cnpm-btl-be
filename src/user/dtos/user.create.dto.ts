import { PickType } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserCreateDto extends PickType(User, [
  'name',
  'username',
  'password',
] as const) {}
