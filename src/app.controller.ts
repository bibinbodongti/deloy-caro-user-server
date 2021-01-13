import { Controller, Get, UseGuards,Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @UseGuards(JwtAuthGuard)
  @Get('information')
  getInformation(@Request() req) {
    return this.appService.getInformation(req);
  }
  @UseGuards(JwtAuthGuard)
  @Get('leaderboard')
  getLeaderBoard() {
    return this.appService.getLeaderBoard();
  }
}
