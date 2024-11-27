import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from '../common/auth/strategy';
import { Printer, PrintJob } from './printing.entity';
import { PrinterService, PrintJobService } from './printing.service';
import { PrinterController, PrintJobController } from './printing.controller';
import { UserModule } from 'src/user/user.module';
import { FileModule } from 'src/file/file.module';
import { File } from 'src/file/file.entity';
import { User } from 'src/user/user.entity';
import { NotifyModule } from 'src/notify/notify.module';
import { NotifyService } from 'src/notify/notify.service';
import { AppModule } from 'src/app.module';
import { AppService } from 'src/app.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Printer, PrintJob, User, File]),
    FileModule,
    NotifyModule,
  ],
  exports: [
    TypeOrmModule.forFeature([Printer, PrintJob]),
    PrintJobService,
    PrinterService,
  ],
  providers: [
    PrinterService,
    PrintJobService,
    NotifyService,
    LocalStrategy,
    AppService,
  ],
  controllers: [PrinterController, PrintJobController],
})
export class PrintingModule {}
