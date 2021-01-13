import { Room } from 'src/rooms/room.entity';
import { User } from 'src/users/user.entity';

export class CreateUserRoomDto {
  user: User;

  room: Room;

  roomPassword?: string;
}
