import axios from "axios";
import * as AWS from 'aws-sdk';
import { SDK } from '@ringcentral/sdk';
import { PassThrough } from 'stream';
import { Readable } from 'stream';

import { Model, Types } from 'mongoose'
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { Messages, MessagesDocument, MessageResources } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsService } from '@/ringcentral/commons/commons.service'
import { ChatsService } from '@/ringcentral/chats/chats.service';
import { SearchMessagesDto } from '@/ringcentral/messages/dto/search-messages.dto.';
import { Message } from '@/ringcentral/messages/entities/message.entity';
import { FindMessagesDto } from '@/ringcentral/messages/dto/find-messages.dto';
import { MigrateMessagesDto } from '@/ringcentral/messages/dto/migrate-messages.dto';
import { ChatsDocument } from '@/ringcentral/chats/schema/chats.schema';
import { CreateChatDto } from '@/ringcentral/chats/dto/create-chat.dto';
import { TypeChat } from "@/ringcentral/chats/schema/chats.schema";
import { Participant } from '@/ringcentral/messages/entities/participant.entity';
import { Credential } from '@/ringcentral/messages/entities/credential.entity';
import { WebsocketsGateway } from "@/websockets/websockets.gateway";
import { ImportantMessageDto } from "./dto/important-message.dto";

@Injectable()
export class MessagesService {

  constructor(
    @InjectModel(Messages.name) private MessagesModule: Model<MessagesDocument>,
    private readonly commonsService: CommonsService,
    private readonly chatsService: ChatsService,
    private readonly websocketsGateway: WebsocketsGateway,
  ) { }

  async create(createMessageDto: CreateMessageDto) {

    const { tokenRc, chatId } = createMessageDto;

    const rcsdk = new SDK({
      server: SDK.server.production,
      clientId: process.env.RINGCENTRAL_CLIENT_ID,
      clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
    });

    const platform = rcsdk.platform();
    await platform.login({ jwt: tokenRc });


    const existingChat = await this.chatsService.findOne(chatId);
    if (!existingChat) {
      throw new NotFoundException('Chat not found');
    }

    try {

      let message: Message

      const s3 = new AWS.S3();

      if (createMessageDto.withImage == 2) {
        const responseApi = await this.commonsService.processMessageFile(createMessageDto);

        message = {
          ...responseApi
        };


        if (message.attachments ?? message.attachments.length > 0) {
          const index = message.attachments.findIndex(attachment => attachment.contentType == "text/plain");
          if (index !== -1) {
            message.attachments.splice(index, 1);
          }

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

      } else {
        const responseApi = await this.commonsService.processMessage(createMessageDto);

        message = {
          ...responseApi
        };

        const index = message.attachments.findIndex(attachment => attachment.contentType == "text/plain");
        if (index !== -1) {
          message.attachments.splice(index, 1);
        }

      }

      message.chatId = new ObjectId(createMessageDto.chatId);
      message.createdBy = createMessageDto.createdBy;
      message.resource = MessageResources.CHAT;

      let messageCreated: MessagesDocument = await this.MessagesModule.create(message)


      if (messageCreated.attachments && messageCreated.attachments.length > 0) {
        for (let file of messageCreated.attachments) {
          const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: file.recordUrl,
            Expires: 3600,
          };

          const signedUrl = await s3.getSignedUrlPromise('getObject', params);
          file.recordUrl = signedUrl;
        };
      }

      this.websocketsGateway.sendNotification('notification-message-created', messageCreated);

      return messageCreated;

    } catch (error) {
      throw new BadRequestException(error.message);
    }

  }


  async findAll(params: SearchMessagesDto) {
    const pageSize = 50;
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


    let finishArray: any[] = [];

    for (let i = 0; i < list.length; i++) {
      const message = list[i];

      finishArray.push(message);

      const addDate = this.addNewDate(message);

      if (i + 1 < list.length) {
        const nextDate = this.addNewDate(list[i + 1]);

        if (addDate !== nextDate) {
          finishArray.push({ chatId: null, day: addDate });
        }
      } else {
        finishArray.push({ chatId: null, day: addDate });
      }
    };

    return finishArray;
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

    try {

      let messages: Message[] = await this.commonsService.getAllMessages(platform, date);
      for (let message of messages) {

        const list = await this.MessagesModule.findOne({ id: message.id }).exec();

        if (list) continue;

        let firstNumber: string;
        let secondNumber: string;
        let secondNumberFormat: string;
        let secondNumberName: string;

        firstNumber = this.commonsService.formatPhoneNumber(message.from.phoneNumber);
        if (message.type == "Fax" && !message.to) {
          secondNumber = this.commonsService.formatPhoneNumber(message.subject);
          secondNumberFormat = message.subject;
          secondNumberName = "";
        } else {
          secondNumber = this.commonsService.formatPhoneNumber(message.to[0].phoneNumber);
          secondNumberFormat = message.to[0].phoneNumber;
          secondNumberName = message.to[0].name;
        }

        let existChat: ChatsDocument = await this.chatsService.findChatPhoneNumbers(firstNumber, secondNumber);

        if (!existChat) {
          const firstParticipant: Participant = {
            phoneNumber: firstNumber,
            searchPhoneNumber: message.from.phoneNumber.slice(2),
            name: message.from.name
          };
          const secondParticipant: Participant = {
            phoneNumber: secondNumber,
            searchPhoneNumber: secondNumberFormat.slice(2),
            name: secondNumberName
          };

          const newChat: CreateChatDto = {
            firstParticipant,
            secondParticipant,
            type: TypeChat.LEAD
          };

          try {
            existChat = await this.chatsService.create(newChat, credentials);
          } catch (e) {
            console.log(e);
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

    } catch (error) {
      console.log(error);
    }
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message id');
    }

    await this.MessagesModule.updateOne({ _id: id }, updateMessageDto);
    const message = await this.MessagesModule.findById(id);

    this.websocketsGateway.sendNotification('notification-update-message', message);

    return message;
  }

  async asignImportantMessage(updateMessageDto: ImportantMessageDto) {
    const { messageId, chatId, important } = updateMessageDto;

    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message id');
    }

    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat id');
    }

    if (important) {
      await this.MessagesModule.updateMany({ chatId: new ObjectId(chatId), important: true }, { $set: { important: false } });
    }

    await this.MessagesModule.updateOne({ _id: new ObjectId(messageId) }, { $set: { important: important } });

    const message = await this.MessagesModule.findById(messageId);

    this.websocketsGateway.sendNotification('notification-update-message-important', message);

    return message;
  }



  remove(id: number) {
    return `This action removes a #${id} message`;
  }


  addNewDate(item: any): string {
    const currentDate = new Date();
    const providedDate = new Date(item.creationTime);

    const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const providedDateWithoutTime = new Date(providedDate.getFullYear(), providedDate.getMonth(), providedDate.getDate());

    const differenceInDays = Math.floor((currentDateWithoutTime.getTime() - providedDateWithoutTime.getTime()) / (1000 * 3600 * 24));

    let dayAdd: string;

    if (differenceInDays === 0) {
      dayAdd = 'Today';
    } else if (differenceInDays === 1) {
      dayAdd = 'Yesterday';
    } else if (differenceInDays < 7) {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayAdd = daysOfWeek[providedDate.getDay()];
    } else {
      const month = ('0' + (providedDate.getMonth() + 1)).slice(-2);
      const day = ('0' + providedDate.getDate()).slice(-2);
      dayAdd = `${month}/${day}/${providedDate.getFullYear()}`;
    }
    return dayAdd;
  }
}
