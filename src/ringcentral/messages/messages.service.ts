import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose';

import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { Messages, MessagesDocument, MessageResources } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsService } from '@/ringcentral/commons/commons.service'
import { ChatsService } from '../chats/chats.service';
import { SearchMessagesDto } from './dto/search-messages.dto.';
import { Message } from './entities/message.entity';
import { FindMessagesDto } from './dto/find-messages.dto';
import { MigrateMessagesDto } from './dto/migrate-messages.dto';

@Injectable()
export class MessagesService {

  constructor(
    @InjectModel(Messages.name) private MessagesModule: Model<MessagesDocument>,
    private readonly commonsService: CommonsService,
    private readonly chatsService: ChatsService,
  ) { }

  async create(createMessageDto: CreateMessageDto) {

    return 1;

    const { chatId } = createMessageDto;

    const existingChat = await this.chatsService.findOne(chatId);
    if (!existingChat) {
      throw new NotFoundException('Chat not found');
    }

    const response = await this.commonsService.processMessage(createMessageDto);
    let message: Message = {
      ...response
    };

    message.chatId = createMessageDto.chatId;
    message.createdBy = createMessageDto.createdBy;
    message.resource = MessageResources.CHAT;

    await this.MessagesModule.create(message)

    return response;
  }


  async findAll(params: SearchMessagesDto) {
    const pageSize = 100;
    const { chatId, page } = params;
    const skip = (page - 1) * pageSize;

    const list = await this.MessagesModule.find({ chatId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec();
    return list;
  }

  async findByText(params: SearchMessagesDto) {
    const pageSize = 20;
    const { chatId, text } = params;

    const list = await this.MessagesModule.aggregate([
      {
        $match: {
          $and: [
            { chatId },
            {
              subject: {
                $regex: text, $options: 'i'
              }
            }
          ]
        }
      },
      {
        $sort: { 'createdAt': -1 }
      },
      {
        $limit: pageSize
      }

    ]);
    return list;
  }

  async findOne(params: FindMessagesDto): Promise<Message | null> {
    const { chatId, column, value } = params;

    try {
      const message = await this.MessagesModule.aggregate([
        {
          $match: {
            chatId: chatId,
            [column]: value
          }
        },
        {
          $limit: 1
        }
      ]);

      return message.length ? message[0] : null;
    } catch (error) {
      throw error;
    }
  }

  async migrate(params: MigrateMessagesDto){
    const { rcToken, date } = params;

    return this.commonsService.getAllMessages(rcToken, date);

    const existingChat = await this.chatsService.findChatPhoneNumbers("","");
    if (!existingChat) {
      throw new NotFoundException('Chat not found');
    }

    return null;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
