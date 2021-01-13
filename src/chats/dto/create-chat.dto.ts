import { UserRoom } from 'src/user-room/user-room.entity';

export class CreateChatDto {
  userRoom: UserRoom;

  content: string;
}
