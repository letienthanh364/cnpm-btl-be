import { PickType } from '@nestjs/swagger';
import { File } from '../file.entity';

export class FileSearchDto extends PickType(File, ['name'] as const) {}
