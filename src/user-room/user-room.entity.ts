import { Chat } from 'src/chats/chat.entity';
import { Room } from 'src/rooms/room.entity';
import { User } from 'src/users/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'user_room' })
export class UserRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userRooms)
  user: User;

  @ManyToOne(() => Room, (room) => room.userRooms)
  room: Room;

  @CreateDateColumn()
  enterDate: Date;

  @OneToMany(() => Chat, (chat) => chat.userRoom)
  chats: Chat[];
}
