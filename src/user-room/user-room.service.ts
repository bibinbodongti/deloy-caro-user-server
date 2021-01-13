import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateUserRoomDto } from './dto/create-user-room.dto';
import { UpdateUserRoomDto } from './dto/update-user-room.dto';
import { UserRoom } from './user-room.entity';
import { RoomsService } from 'src/rooms/rooms.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserRoomService {
  constructor(
    @InjectRepository(UserRoom)
    private userRoomRepository: Repository<UserRoom>,
    private roomsService: RoomsService,
  ) { }

  async create(createUserRoomDto: CreateUserRoomDto): Promise<UserRoom> {
    const room = await this.roomsService.findOne(
      Number(createUserRoomDto.room),
    );
    if (room.password) {
      if (
        createUserRoomDto.roomPassword &&
        bcrypt.compareSync(createUserRoomDto.roomPassword, room.password)
      ) {
        delete createUserRoomDto.roomPassword;
        return await this.userRoomRepository.save(createUserRoomDto);
      } else {
        const errors = { roomPassword: "Room's password is not correctly" };
        throw new HttpException(
          { message: 'Input data validation failed', errors },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    if (createUserRoomDto.roomPassword) delete createUserRoomDto.roomPassword;
    return await this.userRoomRepository.save(createUserRoomDto);
  }

  async findUserRoom(roomID, userID) {
    return await this.userRoomRepository.query(
      `SELECT userroom.enterDate, userroom.id 
      FROM advancedcaro.user_room as userroom 
      where userroom.userId = ${userID} AND roomID = ${roomID} 
      HAVING userroom.enterDate >= MAX(userroom.enterDate)`)
  }


  async createUserRoom(roomID, userID) {
    const newUserRoom = new UserRoom();
    newUserRoom.room = roomID;
    newUserRoom.user = userID;
    return await this.userRoomRepository.save(newUserRoom);
  }


  async findAll(): Promise<UserRoom[]> {
    return await this.userRoomRepository.find();
  }

  async findOne(id: number): Promise<UserRoom> {
    return await this.userRoomRepository.findOne(id);
  }

  async update(
    id: number,
    updateUserRoomDto: UpdateUserRoomDto,
  ): Promise<UserRoom> {
    const toUpdate = await this.userRoomRepository.findOne(id);

    const updated = Object.assign(toUpdate, updateUserRoomDto);
    return await this.userRoomRepository.save(updated);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.userRoomRepository.delete(id);
  }
}
