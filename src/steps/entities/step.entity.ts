import { Match } from 'src/matchs/match.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'step' })
export class Step {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  position: number;

  @CreateDateColumn()
  time: Date;

  @ManyToOne(() => Match, (match) => match.steps)
  match: Match;

  @ManyToOne(() => User, (user) => user.steps)
  user: User;
}
