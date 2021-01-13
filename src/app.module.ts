import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RanksModule } from './ranks/ranks.module';
import { RoomsModule } from './rooms/rooms.module';
import { UserRoomModule } from './user-room/user-room.module';
import { ChatsModule } from './chats/chats.module';
import { MatchsModule } from './matchs/matchs.module';
import { StepsModule } from './steps/steps.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    AuthModule,
    UsersModule,
    RanksModule,
    RoomsModule,
    UserRoomModule,
    ChatsModule,
    MatchsModule,
    StepsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
