import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserData } from '../users/users.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  async signup(@Body() user: CreateUserDto): Promise<UserData> {
    return this.usersService.create(user);
  }

  @Post('google')
  async loginWithGoogle(@Body() body: { access_token: string }) {
    return this.authService.loginWithGoogle(body.access_token);
  }
  @Post('facebook')
  async loginWithFacebook(
    @Body() body: { access_token: string; userID: string },
  ) {
    return this.authService.loginWithFacebook(body.access_token, body.userID);
  }
  @Post('forgetpassword')
  async ForgetPassword(@Body() body: { email: string }) {
    return this.authService.FindAccount(body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('checktokenresetpassword')
  async checkTokenResetPassword(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('resetpassword')
  async ResetPassword(@Body() body: { newPassword: string }, @Request() req) {
    return await this.authService.ResetPassword(req.user.id, body.newPassword);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Req() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
