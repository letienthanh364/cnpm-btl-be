import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './file.entity';
import { GoogleDriveService } from 'src/google-drive.service';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<File> {
    const fileId = await this.googleDriveService.uploadFile(file);
    const fileUrl = await this.googleDriveService.getFileUrl(fileId);

    const fileEntity = this.fileRepository.create({
      name: file.originalname,
      mimeType: file.mimetype,
      path: fileUrl, // Save the Google Drive file URL or ID in the database
    });

    return this.fileRepository.save(fileEntity);
  }

  async getFile(fileId: string): Promise<string> {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }
}
