import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NotifyService } from './notify.service';
import {
  NotifyCreateDto,
  NotifyPrintjobCreateDto,
} from './dtos/notify.create.dto';
import { Notify } from './notify.entity';
import { NotifySearchDto } from './dtos/notify.search.dto';

@Controller('notify')
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post('')
  async create(@Body() notify: NotifyCreateDto): Promise<Notify> {
    return this.notifyService.create(notify);
  }

  @Post('printjob')
  async createPrintjobNotify(
    @Body() notify: NotifyPrintjobCreateDto,
  ): Promise<Notify> {
    return this.notifyService.createPrintjobNotification(notify);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Notify> {
    return this.notifyService.findOne(id);
  }

  @Get()
  async search(
    @Query('receiver_ids') receiverIds?: string | string[],
    @Query('printjob_id') printjobId?: string,
    @Query('type') type?: string,
  ): Promise<Notify[]> {
    const receiverIdsArray = Array.isArray(receiverIds)
      ? receiverIds
      : receiverIds
        ? [receiverIds]
        : undefined;

    const searchData: NotifySearchDto = {
      receiver_ids: receiverIdsArray,
      printjob_id: printjobId,
      type,
    };

    return this.notifyService.search(searchData);
  }
}
