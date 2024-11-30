import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { File } from './file.entity';
import { GoogleDriveService } from 'src/google-drive.service';
import { AppService } from 'src/app.service';
import { PrintJob } from 'src/printing/printing.entity';
import { Notify } from 'src/notify/notify.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, PrintJob, Notify])],
  exports: [TypeOrmModule.forFeature([File]), FileService],
  controllers: [FileController],
  providers: [FileService, GoogleDriveService, AppService],
})
export class FileModule {}
