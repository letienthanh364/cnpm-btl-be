import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from '../common/auth/strategy';

import { NotifyService } from './notify.service';
import { NotifyController } from './notify.controller';
import { Notify } from './notify.entity';
import { PrintJob } from 'src/printing/printing.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notify, PrintJob, User])],
  exports: [TypeOrmModule.forFeature([Notify])],
  providers: [NotifyService, LocalStrategy],
  controllers: [NotifyController],
})
export class NotifyModule {}
