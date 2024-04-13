import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose';

import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { Messages, MessagesDocument, MessageResources } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsService } from '@/ringcentral/commons/commons.service'
import { ChatsService } from '../chats/chats.service';
import { SearchMessagesDto } from './dto/search-messages.dto.';
import { Message } from '@/ringcentral/messages/entities/message.entity';
import { FindMessagesDto } from './dto/find-messages.dto';
import { MigrateMessagesDto } from './dto/migrate-messages.dto';
import { ChatsDocument } from '@/ringcentral/chats/schema/chats.schema';
import { CreateChatDto } from '@/ringcentral/chats/dto/create-chat.dto';
import { TypeChat } from "@/ringcentral/chats/schema/chats.schema";
import { Participant } from '@/ringcentral/messages/entities/participant.entity';
import { ObjectId } from 'mongodb';
import axios from "axios";
import { Credential } from '@/ringcentral/messages/entities/credential.entity';
import * as AWS from 'aws-sdk';
import { SDK } from '@ringcentral/sdk';
import { PassThrough } from 'stream';

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

    let list = await this.MessagesModule.find({ chatId: new ObjectId(chatId) }).sort({ creationTime: -1 }).skip(skip).limit(pageSize).exec();

    const s3 = new AWS.S3();
    for (let message of list) {
      if (message.attachments && message.attachments.length > 0) {
        for (let file of message.attachments) {
          const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: file.recordUrl,
            Expires: 3600,
          };

          const signedUrl = await s3.getSignedUrlPromise('getObject', params);
          file.recordUrl = signedUrl;
        };
      }
    };

    return list;
  }

  async findByText(params: SearchMessagesDto) {
    const pageSize = 20;
    const { chatId, text } = params;

    let list: MessagesDocument[] = await this.MessagesModule.aggregate([
      {
        $match: {
          $and: [
            { chatId: new ObjectId(chatId) },
            {
              subject: {
                $regex: text, $options: 'i'
              }
            }
          ]
        }
      },
      {
        $sort: { 'creationTime': -1 }
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
            chatId: new ObjectId(chatId),
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

  async migrate(params: MigrateMessagesDto) {
    const { rcToken, date } = params;

    const rcsdk = new SDK({
      server: SDK.server.production,
      clientId: process.env.RINGCENTRAL_CLIENT_ID,
      clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
    });
    const platform = rcsdk.platform();
    await platform.login({ jwt: rcToken });

    const api = process.env.NEW_BACK_URL + '/ring-central/credentials/all';
    const responseCredentials = await axios.get(api);
    const credentials: Credential[] = responseCredentials.data;

    let messages: Message[] = await this.commonsService.getAllMessages(platform, date);
    // console.log(messages);

    for (let message of messages) {
      const list = await this.MessagesModule.findOne({ id: message.id }).exec();

      if (list) return;

      const firstNumber: string = this.commonsService.formatPhoneNumber(message.from.phoneNumber);
      const secondNumber: string = this.commonsService.formatPhoneNumber(message.to[0].phoneNumber);

      let existChat: ChatsDocument = await this.chatsService.findChatPhoneNumbers(firstNumber, secondNumber);

      if (!existChat) {
        const firstParticipant: Participant = {
          phoneNumber: firstNumber,
          searchPhoneNumber: message.from.phoneNumber.slice(2)
        };
        const secondParticipant: Participant = {
          phoneNumber: secondNumber,
          searchPhoneNumber: message.to[0].phoneNumber.slice(2)
        };

        const newChat: CreateChatDto = {
          firstParticipant,
          secondParticipant,
          type: TypeChat.LEAD
        };

        try {
          existChat = await this.chatsService.create(newChat, credentials);
        } catch (e) {
          return;
        }

      }

      message.resource = MessageResources.MIGRATION;
      message.chatId = existChat._id;

      if (message.attachments ?? message.attachments.length > 0) {
        const index = message.attachments.findIndex(attachment => attachment.contentType == "text/plain");
        if (index !== -1) {
          message.attachments.splice(index, 1);
        }

        const s3 = new AWS.S3();
        for (let file of message.attachments) {

          const response: any = await platform.get(file.uri);
          const contentBody: PassThrough = response.body;

          if (contentBody) {
            const fileName = "messages_files/" + file.id;

            const params: AWS.S3.PutObjectRequest = {
              Bucket: process.env.AWS_BUCKET,
              Key: fileName,
              Body: contentBody
            };

            await s3.upload(params).promise();
            file.recordUrl = fileName;

          }
        };


      };

      this.MessagesModule.create(message)

    };

    return messages;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message id');
    }

    return this.MessagesModule.updateOne({ _id: id }, updateMessageDto);
  }


  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
