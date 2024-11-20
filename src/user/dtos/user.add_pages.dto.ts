import { PickType } from '@nestjs/swagger';
import { User } from 'src/user/user.entity';

export class UserAddPagesDto extends PickType(User, ['id'] as const) {
  pages: number;
}
