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
    const { firstParticipant, secondParticipant } = createChatDto;
    const firstNumber = firstParticipant.phoneNumber;
    const secondNumber = secondParticipant.phoneNumber;

    const existingChat = await this.ChatsModule.findOne({
      $or: [
        {
          'firstParticipant.phoneNumber': firstNumber,
          'secondParticipant.phoneNumber': secondNumber
        },
        {
          'firstParticipant.phoneNumber': secondNumber,
          'secondParticipant.phoneNumber': firstNumber
        }
      ]
    }).exec();

    if (existingChat) {
      throw new ConflictException('This chat has already been created');
    }

    const created = await this.ChatsModule.create(createChatDto)
    return created;
  }

  async findAll(phoneNumber: string, page: number) {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const list = await this.ChatsModule.find({
      $or: [
        { 'firstParticipant.phoneNumber': phoneNumber },
        { 'secondParticipant.phoneNumber': phoneNumber }
      ]
    }).skip(skip).limit(pageSize).exec();
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
