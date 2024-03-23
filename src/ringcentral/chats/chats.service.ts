import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Model } from 'mongoose'
import { Chats, ChatsDocument } from './schema/chats.schema';

@Injectable()
export class ChatsService {

  constructor(@InjectModel(Chats.name) private ChatsModule: Model<ChatsDocument>) { }

  async create(createChatDto: CreateChatDto) {
    const created = await this.ChatsModule.create(createChatDto)
    return created;
  }

  async findAll() {
    const list = await this.ChatsModule.find({});
    return list;
  }

  findOne(id: string) {

    const chat = this.ChatsModule.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
