import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
  ) { }

  async create(createChatDto: CreateChatDto): Promise<Chat> {
    return await this.chatsRepository.save(createChatDto);
  }

  async createChat(userRoom, content, time) {
    const newChat = new Chat();
    newChat.userRoom = userRoom;
    newChat.contents = content;
    newChat.sentDate = new Date(time);
    return await this.chatsRepository.save(newChat);
  }

  async findChatOfMatch(startTime, endTime, roomID) {

    return (await this.chatsRepository.query(`
    SELECT ch.contents as content, ch.sentDate as sendDate, u.username as name, u.id as userID
    FROM advancedcaro.chat as ch join advancedcaro.user_room as userroom on ch.userRoomId = userroom.id join advancedcaro.user as u on userroom.userId = u.id
    Where userroom.roomID = ${roomID}
    ORDER BY ch.sentDate ASC`)).filter(item => Date.parse(item.sendDate) <= Date.parse(endTime) && Date.parse(item.sendDate) >= Date.parse(startTime))
  }
  async findAll() {
    return await this.chatsRepository.find();
  }

  async findOne(id: number) {
    return await this.chatsRepository.findOne(id);
  }

  async update(id: number, updateChatDto: UpdateChatDto): Promise<Chat> {
    const toUpdate = await this.chatsRepository.findOne(id);

    const updated = Object.assign(toUpdate, updateChatDto);
    return await this.chatsRepository.save(updated);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.chatsRepository.delete(id);
  }
}
