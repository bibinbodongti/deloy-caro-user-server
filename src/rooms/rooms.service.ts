import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './room.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    if (createRoomDto.password) {
      const saltRounds = 10;
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPassword = bcrypt.hashSync(createRoomDto.password, salt);
      const newRoom = new Room();
      newRoom.password = hashPassword;
      if (createRoomDto.stepPeriod)
        newRoom.stepPeriod = createRoomDto.stepPeriod;
      return await this.roomsRepository.save(newRoom);
    }
    return await this.roomsRepository.save(createRoomDto);
  }

  async findAll(): Promise<Room[]> {
    return await this.roomsRepository.find();
  }

  async findOne(id: number): Promise<Room> {
    return await this.roomsRepository.findOne(id);
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const toUpdate = await this.roomsRepository.findOne(id);

    const updated = Object.assign(toUpdate, updateRoomDto);
    return await this.roomsRepository.save(updated);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.roomsRepository.delete(id);
  }
}
