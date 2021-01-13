import { Rank } from 'src/ranks/rank.entity';

export interface UserData {
  id?: number;

  username?: string;

  password?: string;

  email?: string;

  name?: string;

  cup?: number;

  createDate?: Date;

  avatarImagePath?: string;

  role?: number;

  isActive?: boolean;

  rank?: Rank;

  status?: boolean;
}
