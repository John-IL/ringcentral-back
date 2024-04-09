import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose';

import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { Messages, MessagesDocument } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsService } from '@/ringcentral/commons/commons.service'
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class MessagesService {

  constructor(
    @InjectModel(Messages.name) private MessagesModule: Model<MessagesDocument>,
    private readonly commonsService: CommonsService,
    private readonly chatsService: ChatsService,
    )
  {}

  async create(createMessageDto: CreateMessageDto) {
    const { chatId } = createMessageDto;

    const existingChat = await this.chatsService.findOne(chatId);
    if (!existingChat) {
      throw new NotFoundException('Chat not found');
    }

    // return this.commonsService.processMessage();
    const created = await this.MessagesModule.create(createMessageDto)
    return created;
  }

  findAll() {
    return `This action returns all messages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
