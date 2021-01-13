import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { userRoles } from '../auth/constants';
import { UserRoom } from 'src/user-room/user-room.entity';
import { Match } from 'src/matchs/match.entity';
import { Step } from 'src/steps/entities/step.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  cup: number;

  @CreateDateColumn()
  createDate: Date;

  @Column({ nullable: true })
  avatarImagePath: string;

  @Column({ default: userRoles.user })
  role: number;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: true })
  status: boolean;

  @Column({ default: 0 })
  countMatch: number;

  @Column({ nullable: true })
  token: string;

  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];

  @OneToMany(() => Match, (match) => match.player1)
  player1Matchs: Match[];

  @OneToMany(() => Match, (match) => match.player2)
  player2Matchs: Match[];

  @OneToMany(() => Step, (step) => step.user)
  steps: Step[];
}
