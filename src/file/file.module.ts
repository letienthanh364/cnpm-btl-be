import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { File } from './file.entity';
import { GoogleDriveService } from 'src/google-drive.service';
import { AppService } from 'src/app.service';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [FileController],
  providers: [FileService, GoogleDriveService, AppService],
})
export class FileModule {}
