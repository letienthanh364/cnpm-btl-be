import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard, AdminGuard } from './common/auth/strategy';
import { Role, Roles } from './common/decorator/role';

@Controller('printing-config')
@UseGuards(JwtAuthGuard, AdminGuard) // Apply guards to all routes
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Get all configuration values
  @Get()
  @Roles(Role.Admin) // Only accessible to admin
  getAllConfig() {
    return this.appService.getAllConfig();
  }

  // Update price per paper
  @Patch('update-price')
  @Roles(Role.Admin) // Only accessible to admin
  updatePrice(@Body('price') price: number) {
    this.appService.setPricePerPaper(price);
    return { message: `Price per paper updated to ${price}` };
  }

  // Update printing time per paper
  @Patch('update-printing-time')
  @Roles(Role.Admin) // Only accessible to admin
  updatePrintingTime(@Body('time') time: number) {
    this.appService.setPrintingTimePerPaper(time);
    return { message: `Printing time per paper updated to ${time}` };
  }

  // Update allowed files
  @Patch('update-allowed-files')
  @Roles(Role.Admin) // Only accessible to admin
  updateAllowedFiles(@Body('files') files: string[]) {
    this.appService.setAllowedFiles(files);
    return { message: `Allowed files updated to ${files.join(', ')}` };
  }
}
