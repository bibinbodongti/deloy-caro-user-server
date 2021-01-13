import { UserRoom } from 'src/user-room/user-room.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'chat' })
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserRoom, (userRoom) => userRoom.chats)
  userRoom: UserRoom;

  @CreateDateColumn()
  sentDate: Date;

  @Column()
  contents: string;
}
