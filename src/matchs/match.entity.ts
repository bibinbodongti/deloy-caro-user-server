import { Room } from 'src/rooms/room.entity';
import { Step } from 'src/steps/entities/step.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'match' })
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.player1Matchs)
  player1: User;

  @ManyToOne(() => User, (user) => user.player2Matchs)
  player2: User;

  @CreateDateColumn()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  status: number;

  @OneToMany(() => Step, (step) => step.match)
  steps: Step[];

  @ManyToOne(() => Room, (room) => room.matchs)
  room: Room;
}
