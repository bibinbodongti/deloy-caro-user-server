import { Module } from '@nestjs/common';
import { UserRoomService } from './user-room.service';
import { UserRoomController } from './user-room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoom } from './user-room.entity';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserRoom]), RoomsModule],
  controllers: [UserRoomController],
  providers: [UserRoomService],
  exports: [UserRoomService]
})
export class UserRoomModule {}
