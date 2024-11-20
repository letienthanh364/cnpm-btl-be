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

@Module({
  imports: [
    TypeOrmModule.forFeature([Printer, PrintJob, User, File]),
    FileModule,
  ],
  exports: [
    TypeOrmModule.forFeature([Printer, PrintJob]),
    PrintJobService,
    PrinterService,
  ],
  providers: [PrinterService, PrintJobService, LocalStrategy],
  controllers: [PrinterController, PrintJobController],
})
export class PrintingModule {}
