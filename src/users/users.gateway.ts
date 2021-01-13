/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Logger, PayloadTooLargeException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';
import * as _ from 'lodash';

import { roomStates } from './constants';
import { Room } from 'src/rooms/room.entity';
import { RoomsService } from './../rooms/rooms.service';
import { MatchsService } from './../matchs/matchs.service';
import { StepsService } from './../steps/steps.service';
import { UserRoomService } from './../user-room/user-room.service';
import { ChatsService } from './../chats/chats.service';
import * as bcrypt from 'bcryptjs';

import { CreateUserRoomDto } from './../user-room/dto/create-user-room.dto';
import { User } from './user.entity';
let userConnect = [];
const player = {};
const roomState = {};

let userPlayNowQueue = [];

@WebSocketGateway()
export class UsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @Inject() private readonly usersService: UsersService;
  @Inject() private readonly roomsService: RoomsService;
  @Inject() private readonly matchsService: MatchsService;
  @Inject() private readonly stepsService: StepsService;
  @Inject() private readonly userRoomService: UserRoomService;
  @Inject() private readonly chatsService: ChatsService;

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('createroom')
  async handleCreateRoom(client: Socket, payload: string[]) {
    try {
      const keys = Object.keys(player);
      for (let i = 0; i < keys.length; i++) {
        if (player[keys[i]].userID === payload[0]) return -1;
      }

      const newRoom = await this.roomsService.create({
        password: payload[1],
        stepPeriod: +payload[2],
      });

      player[String(client.id)] = {
        roomID: String(newRoom.id),
        userID: payload[0],
        isPlayer: 1,
      };

      roomState[String(newRoom.id)] = {
        timeOut: newRoom.stepPeriod * 1000,
        state: [],
      };

      client.join(String(newRoom.id));

      this.userRoomService.createUserRoom(newRoom.id, Number(payload[0]));
      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
      return newRoom.id;
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('joinroom')
  async handleJoinRoom(client: Socket, payload: any) {
    try {
      const keys = Object.keys(player);
      for (let i = 0; i < keys.length; i++) {
        if (player[keys[i]].userID === payload.userID)
          return {
            value: false,
            message: 'Bạn đã tham gia phòng khác!',
          };
      }
      const room = await this.roomsService.findOne(+payload.roomID);
      if (room.password != null) {
        if (payload.roomPassword != null) {
          if (!bcrypt.compareSync(payload.roomPassword, room.password)) {
            return {
              isRoomPasswordErr: true,
              value: false,
              message: 'Mật khẩu phòng không chính xác!',
            };
          }
        } else {
          return {
            isRoomPasswordErr: true,
            value: false,
            message: 'Phòng yêu cầu phải có mật khẩu.',
          };
        }
      }
      const playerList = getPlayers(String(payload.roomID));
      if (playerList.length === 0) {
        player[String(client.id)] = {
          roomID: String(payload.roomID),
          userID: payload.userID,
          isPlayer: 1,
        };
        client.broadcast.to(String(payload.roomID)).emit('newplayer');
      } else if (playerList.length === 1) {
        player[String(client.id)] = {
          roomID: String(payload.roomID),
          userID: payload.userID,
          isPlayer: 2,
        };
        client.broadcast.to(String(payload.roomID)).emit('newplayer');
      } else {
        player[String(client.id)] = {
          roomID: String(payload.roomID),
          userID: payload.userID,
          isPlayer: 0,
        };
        this.server.to(String(payload.roomID)).emit(
          'newviewer',
          getViewer(String(payload.roomID)).map((item) => item.userID),
        );
      }

      client.join(String(payload.roomID));

      this.userRoomService.createUserRoom(
        Number(payload.roomID),
        Number(payload.userID),
      );
      // this.usersService.findOneById(payload.userID).then((user) => {
      //   client.broadcast.to(String(payload.roomID)).emit('newplayer', {
      //     id: user.id,
      //     username: user.username
      //   })
      // });

      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
      return {
        value: true,
        message: '',
      };
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('becomeplayer')
  async handleBecomePlayer(client: Socket, payload) {
    const playerList = getPlayers(String(payload.roomID));
    let res = 0;
    if (playerList.length === 0) {
      player[String(client.id)].isPlayer = 1;
      this.server.to(String(payload.roomID)).emit('newplayer');
      res = 1;
    } else if (playerList.length === 1) {
      player[String(client.id)].isPlayer = 2;
      this.server.to(String(payload.roomID)).emit('newplayer');
      res = 2;
    } else player[String(client.id)].isPlayer = 0;

    this.server.to(String(payload.roomID)).emit(
      'newviewer',
      getViewer(String(payload.roomID)).map((item) => item.userID),
    );

    return res;
  }

  @SubscribeMessage('getplayers')
  async handleGetPlayers(client: Socket, payload) {
    const playerList = getPlayers(String(payload.roomID));

    const index = _.findIndex(
      playerList,
      (item) => item.userID === player[String(client.id)].userID,
    );
    if (index !== -1) {
      const temp = playerList.splice(index, 1);
      playerList.push(temp[0]);
    }

    return playerList;
  }

  @SubscribeMessage('getRoomPeriod')
  async handleGetRoomPeriod(client: Socket, payload) {
    return Number(roomState[payload.roomID].timeOut);
  }

  @SubscribeMessage('getviewers')
  async handleGetViewer(client: Socket, payload) {
    const result = getViewer(String(payload.roomID)).map((item) => item.userID);
    return result;
  }

  @SubscribeMessage('inviteplayer')
  async handleInvitePlayer(client: Socket, payload) {
    const user = await this.usersService.findOneById(
      Number(player[String(client.id)].userID),
    );

    userConnect.forEach((element) => {
      if (payload.userIDs.includes(element.userID)) {
        client.to(element.socketID).emit('inviteplay', {
          username: user.username,
          roomID: payload.roomID,
        });
      }
    });
  }

  @SubscribeMessage('standup')
  async handleStandUp(client: Socket, payload) {
    player[String(client.id)].isPlayer = 0;

    const keys = Object.keys(player);

    for (let i = 0; i < keys.length; i++) {
      if (
        player[keys[i]].roomID === String(payload.roomID) &&
        player[keys[i]].isPlayer !== 0
      ) {
        player[keys[i]].isPlayer = 1;
        break;
      }
    }

    this.server.to(String(payload.roomID)).emit('newplayer');
    this.server.to(String(payload.roomID)).emit(
      'newviewer',
      getViewer(String(payload.roomID)).map((item) => item.userID),
    );

    return true;
  }

  @SubscribeMessage('readyplay')
  async handleReadyPlay(client: Socket, payload) {
    const user = player[String(client.id)];
    client.broadcast
      .to(String(payload.roomID))
      .emit('readyplayer', user.userID);
  }

  @SubscribeMessage('reconnectroom')
  async handleReconnectRoom(client: Socket, payload) {
    const keys = Object.keys(player);

    if (!keys.includes(String(client.id))) {
      const self = getPlayer(String(payload.roomID), payload.userID);
      if (self) {
        player[String(client.id)] = {
          roomID: String(payload.roomID),
          userID: payload.userID,
          isPlayer: self.isPlayer,
        };
        client.join(String(payload.roomID));
        deleteSamePlayer(String(payload.roomID), payload.userID);
        return self.isPlayer;
      } else {
        const playerList = getPlayers(String(payload.roomID));
        client.join(String(payload.roomID));
        if (playerList.length === 0) {
          player[String(client.id)] = {
            roomID: String(payload.roomID),
            userID: payload.userID,
            isPlayer: 1,
          };
          this.server.to(String(payload.roomID)).emit('newplayer');
          return 1;
        } else if (playerList.length === 1) {
          // const res = playerList[0].isPlayer === 1 ? 2 : 1;
          player[String(client.id)] = {
            roomID: String(payload.roomID),
            userID: payload.userID,
            isPlayer: 2,
          };
          this.server.to(String(payload.roomID)).emit('newplayer');
          return 2;
        } else {
          player[String(client.id)] = {
            roomID: String(payload.roomID),
            userID: payload.userID,
            isPlayer: 0,
          };
          this.server.to(String(payload.roomID)).emit(
            'newviewer',
            getViewer(String(payload.roomID)).map((item) => item.userID),
          );
          return 0;
        }
      }
    }

    return player[String(client.id)].isPlayer;
  }

  @SubscribeMessage('getroomstate')
  async handleGetRoomState(client: Socket, payload) {
    try {
      const keys = Object.keys(roomState);

      if (keys.includes(String(payload.roomID)))
        return roomState[String(payload.roomID)].state;

      return null;
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('getwaittingplayers')
  async handleGetWaittingPlayers(client: Socket, payload) {
    return getWaitingPlayerIDs();
  }

  @SubscribeMessage('startgame')
  async handleStartGame(client: Socket, payload) {
    try {
      const roomID = player[String(client.id)].roomID;
      if (getPlayers(roomID).length !== 2) return false;

      client.broadcast.to(String(payload.roomID)).emit('startgame', {
        id: player[String(client.id)].userID,
        alphabet: payload.alphabet,
        startTime: Date.now(),
      });

      if (payload.alphabet === 'X') {
        roomState[roomID].state.push({
          position: null,
          alphabet: 'X',
          userID: player[String(client.id)].userID,
          startTime: Date.now(),
        });

        roomState[roomID].state.push({
          position: null,
          alphabet: 'O',
          userID: getOtherPlayerOfRoom(roomID, player[String(client.id)].userID)
            .userID,
          startTime: Date.now(),
        });
      } else {
        roomState[roomID].state.push({
          position: null,
          alphabet: 'O',
          userID: getOtherPlayerOfRoom(roomID, player[String(client.id)].userID)
            .userID,
          startTime: Date.now(),
        });

        roomState[roomID].state.push({
          position: null,
          alphabet: 'X',
          userID: player[String(client.id)].userID,
          startTime: Date.now(),
        });
      }

      setTimeout(() => {
        const state = roomState[roomID].state;

        if (
          state.length > 0 &&
          Date.now() - state[state.length - 1].startTime >
          roomState[roomID].timeOut
        ) {
          const players = getPlayers(roomID);
          this.handleEndMatch(client, {
            roomID: roomID,
            status: state[state.length - 1].alphabet === 'X' ? 1 : 2,
            player1ID:
              players[0].isPlayer === 1 ? players[0].userID : players[1].userID,
            player2ID:
              players[1].isPlayer === 1 ? players[0].userID : players[1].userID,
          });
        }
      }, roomState[roomID].timeOut + 1000);
      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
      return true;
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('getrooms')
  async handleGetRooms(client: Socket, payload) {
    try {
      return getRooms().map((item) => {
        return {
          ...item,
          roomState:
            roomState[String(item.roomID)].state.length === 0
              ? roomStates.waiting
              : roomStates.playing,
        };
      });
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('playchess')
  async handlePlayChess(client: Socket, payload) {
    try {
      const result = {
        position: payload.position,
        alphabet: payload.alphabet,
        userID: player[String(client.id)].userID,
        startTime: Date.now(),
      };

      roomState[String(payload.roomID)].state.push(result);
      client.broadcast.to(String(payload.roomID)).emit('playchess', {
        position: result.position,
        alphabet: result.alphabet,
        startTime: result.startTime,
      });

      setTimeout(() => {
        const state = roomState[String(payload.roomID)].state;
        if (
          state.length > 0 &&
          Date.now() - state[state.length - 1].startTime >
          roomState[String(payload.roomID)].timeOut
        ) {
          const players = getPlayers(String(payload.roomID));
          this.handleEndMatch(client, {
            roomID: payload.roomID,
            status: state[state.length - 1].alphabet === 'X' ? 1 : 2,
            player1ID:
              players[0].isPlayer === 1 ? players[0].userID : players[1].userID,
            player2ID:
              players[1].isPlayer === 1 ? players[0].userID : players[1].userID,
          });
        }
      }, roomState[String(payload.roomID)].timeOut + 1000);
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('drawrequest')
  async handleDrawRequest(client: Socket, payload) {
    client.broadcast.to(String(payload.roomID)).emit('drawrequest');
  }

  @SubscribeMessage('responsedrawrequest')
  async handleResponseDrawRequest(client: Socket, payload) {
    client.broadcast
      .to(String(payload.roomID))
      .emit('responsedrawrequest', payload.isAccept);
  }

  @SubscribeMessage('surrender')
  async handleSurrender(client: Socket, payload) {
    client.broadcast.to(String(payload.roomID)).emit('surrender');
  }

  @SubscribeMessage('endmatch')
  async handleEndMatch(client: Socket, payload) {
    try {
      const copiedState = [...roomState[String(payload.roomID)].state];
      endMatch(String(payload.roomID));
      this.server.to(String(payload.roomID)).emit('endmatch', {
        winner:
          Number(payload.status) === 0
            ? null
            : Number(payload.status) === 1
              ? payload.player1ID
              : payload.player2ID,
      });
      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
      const user1 = await this.usersService.findOneById(
        Number(payload.player1ID),
      );
      const user2 = await this.usersService.findOneById(
        Number(payload.player2ID),
      );
      this.usersService.plusCountMatch(+payload.player1ID);
      this.usersService.plusCountMatch(+payload.player2ID);

      if (payload.status !== 0) {
        if (payload.status === 1) {
          const range =
            user1.cup > user2.cup ? 3 : user1.cup === user2.cup ? 4 : 5;
          this.usersService.plusCup(+payload.player1ID, range);
          this.usersService.plusCup(+payload.player2ID, -range);
        } else {
          const range =
            user1.cup > user2.cup ? 5 : user1.cup === user2.cup ? 4 : 3;
          this.usersService.plusCup(+payload.player1ID, -range);
          this.usersService.plusCup(+payload.player2ID, range);
        }
      }

      const newMatch = await this.matchsService.createMatch(
        Number(payload.player1ID),
        Number(payload.player2ID),
        new Date(copiedState[0].startTime),
        new Date(Date.now()),
        Number(payload.roomID),
        Number(payload.status),
      );

      copiedState.slice(2).forEach((element) => {
        this.stepsService.createStep(
          element.position,
          new Date(element.startTime),
          newMatch.id,
          element.userID,
        );
      });
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('getonlines')
  async handleGetOnline(client: Socket, payload) {
    return userConnect
      .map((user) => user.userID)
      .filter((user, index, arr) => arr.indexOf(user) === index);
  }

  @SubscribeMessage('leaveroom')
  async handleLeaveRoom(client: Socket, id: string): Promise<void> {
    try {
      const user = player[String(client.id)];
      if (user) {
        this.usersService.findOneById(user.userID).then((res) => {
          client.broadcast
            .to(String(user.roomID))
            .emit('leaveroom', res.username);
        });
        client.leave(user.roomID);

        if (user.isPlayer !== 0) {
          this.server.to(String(user.roomID)).emit('newplayer');
          const keys = Object.keys(player);

          for (let i = 0; i < keys.length; i++) {
            if (
              player[keys[i]].roomID === user.roomID &&
              player[keys[i]].userID != user.userID
            ) {
              player[keys[i]].isPlayer = player[keys[i]].isPlayer !== 0 ? 1 : 0;
              break;
            }
          }
        } else {
          const roomID = String(player[String(client.id)].roomID);
          delete player[String(client.id)];
          this.server.to(roomID).emit(
            'newviewer',
            getViewer(String(user.roomID)).map((item) => item.userID),
          );
        }
      }

      delete player[String(client.id)];
      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('msgToServerOnline')
  async handleMessageOnline(client: Socket, payload: string): Promise<void> {
    try {
      if (
        !userConnect.includes({ socketID: String(client.id), userID: payload })
      ) {
        userConnect.push({ socketID: String(client.id), userID: payload });
        this.server.emit(
          'newConnect',
          userConnect
            .map((user) => user.userID)
            .filter((user, index, arr) => arr.indexOf(user) === index),
        );
      }
      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('msgToServerLogout')
  async handleMessageOffline(client: Socket, payload: string): Promise<void> {
    try {
      const user = player[String(client.id)];
      if (user) {
        this.usersService.findOneById(user.userID).then((res) => {
          client.broadcast
            .to(String(user.roomID))
            .emit('leaveroom', res.username);
        });
        client.leave(user.roomID);
      }

      delete player[String(client.id)];
      userConnect = userConnect.filter((user) => user.userID !== payload);
      this.server.emit(
        'newConnect',
        userConnect
          .map((user) => user.userID)
          .filter((user, index, arr) => arr.indexOf(user) === index),
      );
      this.server.emit(
        'getrooms',
        getRooms().map((item) => {
          return {
            ...item,
            roomState:
              roomState[String(item.roomID)].state.length === 0
                ? roomStates.waiting
                : roomStates.playing,
          };
        }),
      );
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('sendmessage')
  async handleSendChat(client: Socket, payload): Promise<void> {
    try {
      const user = await this.usersService.findOneById(payload.userID);
      const userRoom = await this.userRoomService.findUserRoom(
        Number(payload.roomID),
        Number(payload.userID),
      );
      this.chatsService.createChat(userRoom[0].id, payload.content, payload.time);

      client.broadcast.to(String(payload.roomID)).emit('message', {
        username: user.username,
        content: payload.content,
        time: payload.time,
      });
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('playnow')
  async handlePlayNow(client: Socket, payload: string) {
    try {
      const suitableUserIndex = await this.usersService.getSuitableUserIndex(
        +payload,
        userPlayNowQueue,
      );
      if (suitableUserIndex == -1) {
        userPlayNowQueue.push(+payload);
      } else {
        const hostUserId = +payload;
        const addedUserId = userPlayNowQueue[suitableUserIndex];
        userPlayNowQueue.splice(suitableUserIndex, 1);

        this.server.emit('playnowaccepted', [hostUserId, addedUserId]);
      }

      return true;
    } catch (err) {
      console.log('Crash');
      throw (err);
    }
  }

  @SubscribeMessage('unplaynow')
  async handleUnPlayNow(client: Socket, payload: string) {
    if (userPlayNowQueue.length != 0) {
      userPlayNowQueue = userPlayNowQueue.filter((value, index, arr) => {
        return value !== payload;
      });
    }
    return true;
  }

  @SubscribeMessage('autoaddusertoroom')
  async handleAutoAddUserToRoom(client: Socket, payload: string[]) {
    const roomId = payload[0];
    const userId = payload[1];
    this.server.emit('autoaddusertoroom', [roomId, userId]);
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${String(client.id)}`);
    try {
      if (player[String(client.id)]) {
        if (player[String(client.id)].isPlayer !== 0) {
          const room = roomState[player[String(client.id)].roomID];
          if (room.state.length !== 0) {
            const timeOut =
              room.timeOut +
              room.state[room.state.length - 1].startTime -
              Date.now() +
              2000 +
              (room.state[room.state.length - 1].userID ===
                player[String(client.id)].userID
                ? room.timeOut
                : 0);
            setTimeout(() => {
              if (player[String(client.id)]) {
                const self = getPlayer(
                  player[String(client.id)].roomID,
                  player[String(client.id)].userID,
                );
                if (self) this.handleLeaveRoom(client, 'temp');
                else {
                  client.leave(player[String(client.id)].roomID);
                  delete player[String(client.id)];
                }
              }
            }, timeOut);
          } else {
            this.server
              .to(String(player[String(client.id)].roomID))
              .emit('newplayer');
            client.leave(player[String(client.id)].roomID);
            const keys = Object.keys(player);

            for (let i = 0; i < keys.length; i++) {
              if (
                player[keys[i]].roomID === player[String(client.id)].roomID &&
                player[keys[i]].userID != player[String(client.id)].userID
              ) {
                player[keys[i]].isPlayer = player[keys[i]].isPlayer !== 0 ? 1 : 0;
                break;
              }
            }

            delete player[String(client.id)];
          }
        } else {
          const roomID = player[String(client.id)].roomID;
          client.leave(roomID);
          delete player[String(client.id)];
          client.to(roomID).emit(
            'newviewer',
            getViewer(roomID).map((item) => item.userID),
          );
        }
      }
    } catch (err) {
      console.log('Crash');
      throw (err);
    }

    for (let i = 0; i < userConnect.length; i++) {
      if (userConnect[i].socketID === String(client.id)) {
        userConnect.splice(i, 1);
        break;
      }
    }
  }
}

const getStringOfUserInRoom = (roomID) => {
  const keys = Object.keys(player);
  let count = 0;
  for (let i = 0; i < keys.length; i++) {
    if (player[keys[i]].roomID === roomID) count++;
  }

  return count;
};

const getParticipants = (roomID) => {
  const keys = Object.keys(player);
  const userList = [];

  for (let i = 0; i < keys.length; i++) {
    if (player[keys[i]].roomID === roomID) userList.push(player[keys[i]]);
  }

  return userList;
};

const deleteSamePlayer = (roomID, userID) => {
  const keys = Object.keys(player);

  for (let i = 0; i < keys.length; i++) {
    if (
      player[keys[i]].roomID === String(roomID) &&
      player[keys[i]].userID === userID
    ) {
      delete player[keys[i]];
      break;
    }
  }
};
const getPlayers = (roomID) => {
  const keys = Object.keys(player);
  const playerList = [];

  for (let i = 0; i < keys.length; i++) {
    if (
      player[keys[i]].roomID === String(roomID) &&
      player[keys[i]].isPlayer !== 0
    ) {
      playerList.push(player[keys[i]]);
    }
  }

  return playerList;
};

const getOtherPlayerOfRoom = (roomID, userID) => {
  const keys = Object.keys(player);

  for (let i = 0; i < keys.length; i++) {
    if (
      player[keys[i]].roomID === String(roomID) &&
      player[keys[i]].isPlayer !== 0 &&
      Number(player[keys[i]].userID) !== Number(userID)
    ) {
      return player[keys[i]];
    }
  }
};

const getPlayer = (roomID, userID) => {
  const keys = Object.keys(player);

  for (let i = 0; i < keys.length; i++) {
    if (
      player[keys[i]].roomID === String(roomID) &&
      player[keys[i]].userID === userID &&
      player[keys[i]].isPlayer !== 0
    ) {
      return { ...player[keys[i]] };
    }
  }

  return null;
};

const getRooms = () => {
  const keys = Object.keys(player);
  const list = [];

  for (let i = 0; i < keys.length; i++) {
    list.push(player[keys[i]]);
  }

  const result = list.reduce((res, item) => {
    const pos = _.findIndex(res, (room) => room.roomID === String(item.roomID));
    if (pos === -1) {
      res.push({
        roomID: String(item.roomID),
        users: [item.userID],
      });
    } else {
      res[pos].users.push(item.userID);
    }

    return res;
  }, []);
  return result;
};

const getViewer = (roomID) => {
  const keys = Object.keys(player);
  const list = [];
  for (let i = 0; i < keys.length; i++) {
    if (
      player[keys[i]].roomID === String(roomID) &&
      player[keys[i]].isPlayer === 0
    ) {
      list.push(player[keys[i]]);
    }
  }

  return list;
};

const endMatch = (roomID) => {
  roomState[roomID] = {
    ...roomState[roomID],
    state: [],
  };
};

const getWaitingPlayerIDs = () => {
  const keys = Object.keys(player);

  const result = userConnect.filter((item) => {
    return !keys.includes(String(item.socketID));
  });

  return result.map((item) => item.userID);
};
