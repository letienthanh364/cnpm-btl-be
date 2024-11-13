import { PickType } from '@nestjs/swagger';
import { User } from '../../user/user.entity';

export class JwtPayload extends PickType(User, ['id'] as const) {}
