import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { File } from './file.entity';
import { FileSearchDto } from './dtos/file.search.dto';
import { GoogleDriveService } from 'src/google-drive.service';

@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // Ensure 'file' matches your form-data key
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const savedFile = await this.fileService.uploadFile(file);

    return {
      message: 'File uploaded successfully',
      file: savedFile,
    };
  }

  @Get('')
  async search(@Query('name') fileName?: string): Promise<File[]> {
    const searchDto: FileSearchDto = {
      name: fileName,
    };

    return this.fileService.search(searchDto);
  }

  @Delete(':id')
  async deleteFile(@Param('id') fileId: string) {
    await this.fileService.deleteFile(fileId);
    return { message: `success` };
  }

  @Get('drive')
  async listFiles() {
    const files = await this.googleDriveService.listFiles();
    return { files };
  }
}
