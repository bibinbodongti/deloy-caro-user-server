import { PartialType } from '@nestjs/mapped-types';
import { CreateUserRoomDto } from './create-user-room.dto';

export class UpdateUserRoomDto extends PartialType(CreateUserRoomDto) {}
