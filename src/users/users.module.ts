import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersGateway } from './users.gateway';
import { RoomsModule } from './../rooms/rooms.module';
import { jwtConstants } from './constants';
import { MailModule } from 'src/mail/mail.module';
import { MatchsModule } from './../matchs/matchs.module';
import { StepsModule } from './../steps/steps.module';
import { UserRoomModule } from './../user-room/user-room.module';
import { ChatsModule } from './../chats/chats.module';
import { RanksModule } from 'src/ranks/ranks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
    MailModule,
    MatchsModule,
    StepsModule,
    RoomsModule,
    UserRoomModule,
    ChatsModule,
    RanksModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersGateway],
  exports: [UsersService],
})
export class UsersModule {}
