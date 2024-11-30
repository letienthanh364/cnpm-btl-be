import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { PrintJobService } from 'src/printing/printing.service';
import { PrintJobSearchDto } from 'src/printing/dtos/printjobDtos/printjob.search.dto';
import { PrintJob } from 'src/printing/printing.entity';
import { UserAddPagesDto } from './dtos/user.add_pages.dto';

export interface RequestUser extends Request {
  user: User;
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly notifyService: NotifyService,
    private readonly printjobService: PrintJobService,
  ) {}

  @Post('create-users')
  async register(@Body() users: UserCreateDto[]) {
    const newUsers = await this.userService.createMultipleUsers(users);
    return newUsers.map((user) => {
      const { password, ...res } = user;
      return res;
    });
  }

  @Get('list')
  async listUser() {
    const users = await this.userService.list();
    return users.map((user) => {
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
  @Get('printlogs')
  async listPrintlogs(
    @Req() req: RequestUser,
    @Query() date?: string[],
  ): Promise<PrintJob[]> {
    const printjobSearchDto: PrintJobSearchDto = {
      user_id: req.user.id,
      date: date,
    };

    return this.printjobService.search(printjobSearchDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: RequestUser): Promise<Partial<User>> {
    console.log(req.user);
    const userId = req.user.id;
    const user = await this.userService.findOne(userId);

    // Exclude sensitive fields like password and deleted_at
    const { password, deleted_at, ...userDetails } = user;
    return userDetails;
  }

  @Post('add-pages')
  async addPagesForUser(@Body() body: UserAddPagesDto) {
    return this.userService.addPages(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.userService.findOne(id);
    const { password, ...res } = user;
    return res;
  }
}
