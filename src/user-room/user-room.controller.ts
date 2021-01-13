import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserRoomService } from './user-room.service';
import { CreateUserRoomDto } from './dto/create-user-room.dto';
import { UpdateUserRoomDto } from './dto/update-user-room.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user-room')
export class UserRoomController {
  constructor(private readonly userRoomService: UserRoomService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserRoomDto: CreateUserRoomDto) {
    return this.userRoomService.create(createUserRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.userRoomService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userRoomService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserRoomDto: UpdateUserRoomDto,
  ) {
    return this.userRoomService.update(+id, updateUserRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userRoomService.remove(+id);
  }
}
