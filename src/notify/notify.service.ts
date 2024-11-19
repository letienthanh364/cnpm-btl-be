import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import 'dotenv/config';

import { User } from 'src/user/user.entity';
import { File } from 'src/file/file.entity';
import { calculateNumPages } from 'src/common/printing/printing.utils';
import { Notify } from './notify.entity';
import { NotifySearchDto } from './dtos/notify.search.dto';
import {
  NotifyCreateDto,
  NotifyPrintjobCreateDto,
} from './dtos/notify.create.dto';
import { PrintJob } from 'src/printing/printing.entity';

@Injectable()
export class NotifyService {
  constructor(
    @InjectRepository(Notify)
    private readonly notifyRepo: Repository<Notify>,

    @InjectRepository(PrintJob)
    private readonly printjobRepo: Repository<PrintJob>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(id: string): Promise<Notify> {
    return this.notifyRepo.findOneBy({ id });
  }

  async search(data: NotifySearchDto): Promise<Notify[]> {
    const query = this.notifyRepo
      .createQueryBuilder('notify')
      .leftJoinAndSelect('notify.receivers', 'receivers')
      .leftJoinAndSelect('notify.printjob', 'printjob');

    if (data.type) {
      query.andWhere('notify.type = :type', { type: data.type });
    }

    if (data.printjob_id) {
      query.andWhere('printjob.id = :printjob_id', {
        printjob_id: data.printjob_id,
      });
    }

    if (data.receiver_ids && data.receiver_ids.length > 0) {
      query.andWhere('receivers.id IN (:...receiver_ids)', {
        receiver_ids: data.receiver_ids,
      });
    }

    return query.getMany();
  }

  async listNotificationsForUser(userId: string): Promise<Notify[]> {
    const query = this.notifyRepo
      .createQueryBuilder('notify')
      .leftJoin('notify.receivers', 'receivers') // Join the receivers relation
      .where('receivers.id = :userId', { userId }) // Filter by userId
      .orderBy('notify.created_at', 'DESC'); // Sort by creation date

    return await query.getMany();
  }

  async create(notify: NotifyCreateDto): Promise<Notify> {
    if (!notify.receiver_ids || notify.receiver_ids.length === 0) {
      throw new BadRequestException('receiver_ids must not be empty');
    }

    const users = await this.userRepo.find({
      where: {
        id: In(notify.receiver_ids),
      },
    });

    if (users.length !== notify.receiver_ids.length) {
      const missingIds = notify.receiver_ids.filter(
        (id) => !users.some((user) => user.id === id),
      );
      throw new NotFoundException(
        `The following user IDs do not exist: ${missingIds.join(', ')}`,
      );
    }

    const newNotify = this.notifyRepo.create({
      ...notify,
      receivers: users,
    });

    return await this.notifyRepo.save(newNotify);
  }

  async createPrintjobNotification(
    notifyPrintjob: NotifyPrintjobCreateDto,
  ): Promise<Notify> {
    const printjob = await this.printjobRepo.findOne({
      where: { id: notifyPrintjob.printjob_id },
    });

    if (!printjob) {
      throw new BadRequestException(
        `Printjob with id ${notifyPrintjob.printjob_id} not found`,
      );
    }

    if (
      !notifyPrintjob.receiver_ids ||
      notifyPrintjob.receiver_ids.length === 0
    ) {
      throw new BadRequestException('receiver_ids must not be empty');
    }

    const users = await this.userRepo.find({
      where: { id: In(notifyPrintjob.receiver_ids) },
    });

    if (users.length !== notifyPrintjob.receiver_ids.length) {
      const missingIds = notifyPrintjob.receiver_ids.filter(
        (id) => !users.some((user) => user.id === id),
      );
      throw new BadRequestException(
        `The following user IDs do not exist: ${missingIds.join(', ')}`,
      );
    }

    const newNotify = this.notifyRepo.create({
      ...notifyPrintjob,
      receivers: users,
      printjob,
    });

    return this.notifyRepo.save(newNotify);
  }
}
