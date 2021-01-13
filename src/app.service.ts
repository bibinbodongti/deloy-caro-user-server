import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { MatchsService } from './matchs/matchs.service';
import { RanksService } from './ranks/ranks.service';

@Injectable()
export class AppService {
  constructor(
    private readonly usersService: UsersService,
    private readonly matchsService: MatchsService,
    private readonly ranksService: RanksService,
  ) { }
  getHello(): string {
    return 'Welcome to advanced caro api! Our passion is bring much happiness to you. This api is only for user!';
  }
  async getInformation(req: any): Promise<any> {
    const user = await this.usersService.findOneById(req.user.id);
    const countMatchWin= (await this.matchsService.findCountMatchsWin(user));
    //console.log(countMatchWin); 
    // const countMatchLose= (await this.matchsService.findMatchsByPlayer2(user)).length;
    const rank = await this.ranksService.findOneByQuery(user.cup);
    console.log(countMatchWin);
    let winRatio = user.countMatch!==0?(countMatchWin * 100 / user.countMatch) > 100 ? '100%' : (countMatchWin * 100 / user.countMatch).toFixed(2) + '%':'100%';
    return {
      username: user.username,
      name: user.name,
      email: user.email,
      countMatch: user.countMatch,
      dateCreate: user.createDate,
      winRatio: winRatio,
      rank: rank?.name || 'Chưa có hệ thống rank',
      cup: user.cup ? user.cup : 'Chưa có cup',
      image: user.avatarImagePath,
    }
  }
  async getLeaderBoard(): Promise<any> {
    const users = (await this.usersService.findAll()).sort((user1, user2) => {
      return user2.cup - user1.cup;
    });
    const result = await Promise.all( users.map(async(user)=>{
      let temp = null;
      const rank = await this.ranksService.findOneByQuery(user.cup);
      temp = {
        username: user.username,
        cup: user.cup,
        rank: rank.name?rank.name:'Chưa có hệ thống rank',
      }
      return temp;
    }));
    return result;
  }
}
