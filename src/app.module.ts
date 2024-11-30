import { Module } from '@nestjs/common';
import { AppController, ReportController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from 'ormconfig';
import { UserModule } from './user/user.module';
import { PrintingModule } from './printing/printing.module';
import { FileModule } from './file/file.module';
import { NotifyModule } from './notify/notify.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    UserModule,
    FileModule,
    NotifyModule,
    PrintingModule,
  ],
  controllers: [AppController, ReportController],
  providers: [AppService],
})
export class AppModule {}
