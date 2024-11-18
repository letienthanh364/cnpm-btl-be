import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private drive: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: './google-drive-secret.json', // Replace with your credentials file path
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ fileId: string; fileUrl: string }> {
    const fileMetadata = {
      name: file.originalname,
    };

    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    try {
      // Step 1: Upload the file
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      const fileId = response.data.id;

      // Step 2: Set file permissions (make it publicly accessible)
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader', // 'reader' for view-only access
          type: 'anyone', // 'anyone' makes it public; use 'user' or 'group' for specific access
        },
      });

      // Step 3: Generate the sharable link
      const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

      return { fileId, fileUrl };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error.message);
      throw error;
    }
  }

  async getFileViewUrl(fileId: string): Promise<string> {
    return `https://drive.google.com/uc?id=${fileId}/view?usp=drivesdk`;
  }

  async getFileDownloadUrl(fileId: string): Promise<string> {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId });
      console.log(`File with ID ${fileId} deleted from Google Drive.`);
    } catch (error) {
      console.error(
        `Failed to delete file from Google Drive: ${error.message}`,
      );
      throw error;
    }
  }

  async listFiles(): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        pageSize: 100, // Adjust as needed
        fields:
          'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink)',
      });

      console.log('Files:', response.data.files);
      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error.message);
      throw error;
    }
  }
}
