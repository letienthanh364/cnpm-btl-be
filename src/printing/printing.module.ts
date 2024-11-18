import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from '../common/auth/strategy';
import { Printer } from './printing.entity';
import { PrinterService } from './printing.service';
import { PrinterController } from './printing.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Printer]), UserModule],
  exports: [TypeOrmModule.forFeature([Printer])],
  providers: [PrinterService, LocalStrategy],
  controllers: [PrinterController],
})
export class PrintingModule {}
