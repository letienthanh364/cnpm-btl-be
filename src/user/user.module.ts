import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '../common/auth/strategy';
import { NotifyModule } from 'src/notify/notify.module';
import { Notify } from 'src/notify/notify.entity';
import { NotifyService } from 'src/notify/notify.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotifyModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1y' },
    }),
  ],
  exports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, NotifyService, LocalStrategy],
  controllers: [UserController],
})
export class UserModule {}
