import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserCreateDto } from './dtos/user.create.dto';
import { UserLoginDto } from './dtos/user.login.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/auth/strategy';
import { User } from './user.entity';
import { JwtPayload } from 'src/common/jwt/payload';
import { Notify } from 'src/notify/notify.entity';
import { NotifyService } from 'src/notify/notify.service';
import { CurrentUser } from 'src/common/decorator/user';

export interface RequestUser extends Request {
  user: User;
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly notifyService: NotifyService,
  ) {}

  @Post('create-users')
  async register(@Body() users: UserCreateDto[]) {
    const newUsers = await this.userService.createMultipleUsers(users);
    return newUsers.map((user) => {
      const { password, ...res } = user;
      return res;
    });
  }

  @Post('login')
  async login(@Body() user: UserLoginDto) {
    return this.userService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getUserNotifications(
    @CurrentUser() user: JwtPayload,
  ): Promise<Notify[]> {
    const userId = user.id; // Get the user's ID from the JWT payload
    return this.notifyService.listNotificationsForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: RequestUser): Promise<Partial<User>> {
    const userId = req.user.id;
    const user = await this.userService.findOne(userId);

    // Exclude sensitive fields like password and deleted_at
    const { password, deleted_at, ...userDetails } = user;
    return userDetails;
  }
}
