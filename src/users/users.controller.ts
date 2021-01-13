import {
  Controller,
  Get,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ppid } from 'process';
import { use } from 'passport';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('viewers/ids')
  getViewers(@Body('userIDs') userIDs: Array<number>) {
    return this.usersService.getViewers(userIDs);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOneById(+id);
  }

  @Get('active/:token')
  async Actice(@Param('token') token: string) {
    const user = await this.usersService.findOneByToken(token);
    if (user) {
      if (user.isActive === true)
        return { err: 'Tài khoản của bạn đã được kích hoạt' };
      await this.usersService.update(user.id, { isActive: true });
      await this.usersService.update(user.id, { token: null });
      return (
        'Kích hoạt thành công tài khoản có username "' + user.username + '"'
      );
    } else {
      return {
        err:
          'Kích hoạt thất bại. Vui lòng kiểm tra đường dẫn kích hoạt của bạn.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('online')
  getOnlineUsers(@Body('users') userIDs: Array<number>, @Request() req) {
    return this.usersService.getOnlineUsers(userIDs, req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Post('uploadavt')
  UploadAvt(@Body('linkImage') linkImage: string,@Request() req) {
    return this.usersService.update(req.user.id,{avatarImagePath:linkImage});
  }

  @UseGuards(JwtAuthGuard)
  @Post('changepassword')
  ChangePassword(@Body('oldPassword') oldPassword: string,@Body('newPassword') newPassword: string,@Request() req) {
    return this.usersService.ChangePassword(req.user.id,oldPassword,newPassword);
  }

}
