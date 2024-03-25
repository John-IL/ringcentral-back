import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Model, Types } from 'mongoose'
import { Chats, ChatsDocument } from './schema/chats.schema';

@Injectable()
export class ChatsService {

  constructor(@InjectModel(Chats.name) private ChatsModule: Model<ChatsDocument>) { }

  async create(createChatDto: CreateChatDto) {
    const { firstNumber, secondNumber } = createChatDto;

    const existingChat = await this.ChatsModule.findOne({ firstNumber, secondNumber }).exec();
    if (existingChat) {
      throw new ConflictException('This chat has already been created');
    }

    const created = await this.ChatsModule.create(createChatDto)
    return created;
  }

  async findAll() {
    const list = await this.ChatsModule.find({});
    return list;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat id');
    }

    const chat = await this.ChatsModule.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
