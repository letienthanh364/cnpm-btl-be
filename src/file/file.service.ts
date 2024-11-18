import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './file.entity';
import { GoogleDriveService } from 'src/google-drive.service';
import { FileSearchDto } from './dtos/file.search.dto';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<File> {
    const fileRes = await this.googleDriveService.uploadFile(file);
    const fileUrl = await this.googleDriveService.getFileUrl(fileRes.fileId);

    const fileEntity = this.fileRepository.create({
      name: file.originalname,
      mimeType: file.mimetype,
      path: fileUrl, // Save the Google Drive file URL or ID in the database
    });

    return this.fileRepository.save(fileEntity);
  }

  async search(data: FileSearchDto): Promise<File[]> {
    const query = this.fileRepository.createQueryBuilder('file');

    if (data.name) {
      query.andWhere('file.name = :file_name', {
        file_name: data.name,
      });
    }

    const res = await query.getMany();
    return res;
  }

  async getFile(fileId: string): Promise<string> {
    return `https://drive.google.com/uc?id=${fileId}`;
  }

  async downloadFile(fileId: string): Promise<string> {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }

  async deleteFile(fileId: string): Promise<void> {
    // Find the file metadata in the database
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`file not found`);
    }

    // Extract the fileId from the file.path (Google Drive URL)
    const match = file.path.match(/id=([a-zA-Z0-9_-]+)/);
    if (!match || !match[1]) {
      throw new NotFoundException(
        `Invalid Google Drive file URL: ${file.path}`,
      );
    }
    const extractedFileId = match[1];

    // Delete the file from Google Drive
    await this.googleDriveService.deleteFile(extractedFileId);

    // Delete the metadata from the database
    await this.fileRepository.remove(file);
  }
}
