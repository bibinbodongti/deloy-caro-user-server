import { Match } from 'src/matchs/match.entity';
import { UserRoom } from 'src/user-room/user-room.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'room' })
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  password: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({ nullable: true })
  stepPeriod: number;

  @OneToMany(() => UserRoom, (userRoom) => userRoom.room)
  userRooms: UserRoom[];

  @OneToMany(() => Match, (match) => match.room)
  matchs: Match[];
}
