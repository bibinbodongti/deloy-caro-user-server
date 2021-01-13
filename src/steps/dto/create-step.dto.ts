import { Match } from 'src/matchs/match.entity';
import { User } from 'src/users/user.entity';

export class CreateStepDto {
  position: number;

  match: Match;

  user: User;
}
