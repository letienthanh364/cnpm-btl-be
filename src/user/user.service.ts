import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UserLoginDto } from './dtos/user.login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from 'src/common/jwt/payload';
import { UserCreateDto } from './dtos/user.create.dto';
import 'dotenv/config';
import { UserAddPagesDto } from './dtos/user.add_pages.dto';
import { UserSimpleDto } from './dtos/user.simple.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.userRepo.findOneBy({ id });
  }

  // ! Create multiple accounts
  async createMultipleUsers(users: UserCreateDto[]): Promise<User[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUsers = queryRunner.manager.create(User, users);

      const userPromises = newUsers.map(async (user) => {
        let existingUser = await this.userRepo.findOne({
          where: {
            username: user.username,
          },
        });

        if (existingUser) {
          throw new BadRequestException('User already exists');
        }

        user.password = await bcrypt.hash(user.password, 10);
      });

      await Promise.all(userPromises);

      await queryRunner.manager.save(User, newUsers);

      await queryRunner.commitTransaction();

      return newUsers;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // ! Login
  async login(userData: UserLoginDto): Promise<string> {
    const user = await this.userRepo.findOneBy({
      username: userData.username,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      userData.password,
      user.password,
    );

    const payload: JwtPayload = {
      id: user.id,
    };

    if (isPasswordValid) {
      return this.jwtService.sign(payload);
    }

    throw new UnauthorizedException('login failed');
  }

  async addPages(dto: UserAddPagesDto): Promise<UserSimpleDto> {
    const user = await this.userRepo.findOne({
      where: {
        id: dto.id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.available_pages = user.available_pages + dto.pages;
    this.userRepo.save(user);

    return { name: user.name, available_pages: user.available_pages };
  }
}
