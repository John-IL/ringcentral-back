import axios from "axios";
import * as AWS from 'aws-sdk';
import { SDK } from '@ringcentral/sdk';
import { PassThrough } from 'stream';
import { Request } from 'express';

import { Model, Types } from 'mongoose'
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { Messages, MessagesDocument, MessageResources, MessageType, MessageReadStatus, MessageDirection } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsService } from '@/ringcentral/commons/commons.service'
import { ChatsService } from '@/ringcentral/chats/chats.service';
import { SearchMessagesDto } from '@/ringcentral/messages/dto/search-messages.dto.';
import { Message } from '@/ringcentral/messages/entities/message.entity';
import { FindMessagesDto } from '@/ringcentral/messages/dto/find-messages.dto';
import { MigrateMessagesDto } from '@/ringcentral/messages/dto/migrate-messages.dto';
import { Chats, ChatsDocument } from '@/ringcentral/chats/schema/chats.schema';
import { CreateChatDto } from '@/ringcentral/chats/dto/create-chat.dto';
import { Credential } from '@/ringcentral/messages/entities/credential.entity';
import { WebsocketsGateway } from "@/websockets/websockets.gateway";
import { ImportantMessageDto } from "./dto/important-message.dto";
import { SearchTopicMessagesDto } from '@/ringcentral/messages/dto/search-topic-message.dto';

import { CommonsService as CommonsServiceGeneral } from '@/commons/commons.service';

@Injectable()
export class MessagesService {

  constructor(
    @InjectModel(Messages.name) private MessagesModule: Model<MessagesDocument>,
    @InjectModel(Chats.name) private ChatsModule: Model<ChatsDocument>,
    private readonly commonsService: CommonsService,
    private readonly chatsService: ChatsService,
    private readonly CommonsServiceGeneral: CommonsServiceGeneral,

    private readonly websocketsGateway: WebsocketsGateway,
  ) { }

  async create(createMessageDto: CreateMessageDto) {

    // return 1;

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

      await this.ChatsModule.updateOne({ _id: messageCreated.chatId }, {
        lastMessage: messageCreated
      });

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
      const chatId = new ObjectId(createMessageDto.chatId);

      const currentDate = new Date();

      let message: Message = {
        chatId: chatId,
        createdBy: createMessageDto.createdBy,
        resource: MessageResources.CHAT,
        direction: createMessageDto.direction,
        subject: createMessageDto.subject,
        to: [
          {
            phoneNumber: createMessageDto.toNumber
          }
        ],
        from: {
          phoneNumber: createMessageDto.fromNumber
        },
        type: MessageType.SMS,
        readStatus: MessageReadStatus.UNREAD,
        creationTime: currentDate,
        error: error.message
      }

      const messageError = await this.MessagesModule.create(message)

      this.websocketsGateway.sendNotification('notification-message-created', messageError);
      return messageError;
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

  async findOne(params: FindMessagesDto): Promise<Message[] | null> {
    const { chatId, column, value, limit } = params;

    try {
      const message = await this.MessagesModule.aggregate([
        {
          $match: {
            chatId: new ObjectId(chatId),
            [column]: value
          }
        },
        {
          $limit: limit
        }
      ]);

      return message;
    } catch (error) {
      throw error;
    }
  }

  async migrate(params: MigrateMessagesDto) {
    const { rcToken, date } = params;

    try {

      let messages: Message[] = await this.commonsService.getAllMessages(rcToken, date);

      // messages.sort((a, b) => {
      //   const dateA = new Date(a.creationTime).toISOString();
      //   const dateB = new Date(b.creationTime).toISOString();
      //   return dateA.localeCompare(dateB);
      // })

      messages.reverse();

      const api = process.env.NEW_BACK_URL + '/ring-central/get-ring-central-credentials';
      const { data } = await axios.post(api);
      const credentials: Credential[] = data.data;

      for (let message of messages) {
        await this.processInformation(message, credentials);
      };

      return messages;

    } catch (error) {
      console.log(error);
    }
  }

  async webhook(request: Request) {

    try {

      const api = process.env.NEW_BACK_URL + '/ring-central/get-ring-central-credentials';
      const { data } = await axios.post(api);
      const credentials: Credential[] = data.data;

      const message: Message = request.body.body;

      if (message.direction == MessageDirection.INBOUND && message.to[0].phoneNumber == '+16263467630') return;

      await this.processInformation(message, credentials);

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

  async processInformation(message: Message, credentials: Credential[]) {

    try {

      const existMessage = await this.MessagesModule.findOne({ id: message.id }).exec();

      if (existMessage) return;

      let firstNumber: string;
      let secondNumber: string;

      firstNumber = this.commonsService.formatPhoneNumber(message.from.phoneNumber);

      if (message.type == "Fax" && !message.to) {
        secondNumber = this.commonsService.formatPhoneNumber(message.subject);
      } else {
        secondNumber = this.commonsService.formatPhoneNumber(message.to[0].phoneNumber);
      }

      let existChat: ChatsDocument = await this.chatsService.findChatPhoneNumbers(firstNumber, secondNumber);

      if (!existChat) {

        const newChat: CreateChatDto = {
          firstNumber: firstNumber,
          secondNumber: secondNumber
        };

        try {
          existChat = await this.chatsService.create(newChat, credentials);
        } catch (e) {
          return;
        }
      } else {

        if (message.direction == MessageDirection.INBOUND) {

          const lastMessageSent = await this.MessagesModule.findOne(
            {
              chatId: existChat._id, direction: MessageDirection.OUTBOUND,
              messageTopicId: { $exists: true, $ne: null }
            }
          ).exec();

          if (lastMessageSent) {
            message.messageTopicId = lastMessageSent.messageTopicId;
            message.answerMessageId = lastMessageSent._id;
          }
        }
      }

      // message.resource = MessageResources.MIGRATION;
      message.chatId = existChat._id;

      const s3 = new AWS.S3();

      const rcsdk = new SDK({
        server: SDK.server.production,
        clientId: process.env.RINGCENTRAL_CLIENT_ID,
        clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
      });

      if (message.attachments ?? message.attachments.length > 0) {
        const index = message.attachments.findIndex(attachment => attachment.contentType == "text/plain");
        if (index !== -1) {
          message.attachments.splice(index, 1);
        }

        if (message.attachments.length > 0) {

          const platform = rcsdk.platform();
          await platform.login({ jwt: process.env.RINGCENTRAL_JWT });

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
        }
      };

      let messageCreated: MessagesDocument = await this.MessagesModule.create(message)

      let counterUnread = 0

      if (messageCreated.direction == "Inbound" && messageCreated.readStatus == "Unread") {
        counterUnread = existChat.unreadCount;
        counterUnread++;
      }

      await this.ChatsModule.updateOne({ _id: messageCreated.chatId }, {
        lastMessage: messageCreated,
        unreadCount: counterUnread
      });

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
    } catch (error) {
      console.log(error)
    }
  }

  async getAnswersByMessageTopic(search: SearchTopicMessagesDto) {
    const { messageId, page, perPage } = search;
    const skip = (page - 1) * perPage;


    const messages: any[] = await this.MessagesModule.aggregate([
      {
        $match: {
          messageTopicId: messageId,
          direction: MessageDirection.INBOUND
        }
      },

      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat'
        }
      },

      {
        $unwind: '$chat'
      },

      {
        $group: {
          _id: '$chatId',
          chat: { $first: '$chat' },
          messages: {
            $push: '$$ROOT'
          }
        }
      },

      {
        $sort: {
          'chat.unreadCount': -1,
          'chat.lastMessage.creationTime': -1,
        }
      }

    ]).skip(skip).limit(perPage);


    const totalChats = await this.MessagesModule.aggregate([
      {
        $match: {
          messageTopicId: messageId,
          direction: MessageDirection.INBOUND
        }
      },
      {
        $group: {
          _id: '$chatId'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMessages = totalChats.length > 0 ? totalChats[0].count : 0;

    return this.CommonsServiceGeneral.paginate(messages, totalMessages, perPage, page);

  }

  async getAnswersByMessageTopicId(id: number) {
    const messages: any[] = await this.MessagesModule.aggregate([
      {
        $match: {
          messageTopicId: id,
          direction: MessageDirection.INBOUND,
          readStatus: "Unread"
        }
      },

      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat'
        }
      },

      {
        $unwind: '$chat'
      },

      {
        $project: {
          _id: 1,
          subject: 1,
          type: 1,
          creationTime: 1,
          messageTopicId: 1,


          chat: 1,
        }
      },
    ]);

    return messages;
  }

  async getAnswersByCredentialId(id: number) {
    const messages: any[] = await this.MessagesModule.aggregate([
      {
        $match: {
          messageTopicId: null,
          direction: MessageDirection.INBOUND,
          readStatus: "Unread",
        }
      },

      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat'
        }
      },

      {
        $unwind: '$chat'
      },

      {
        $project: {
          _id: 1,
          subject: 1,
          type: 1,
          creationTime: 1,
          messageTopicId: 1,


          chat: 1,
        }
      },
      {
        $match: {
          "chat.credentialId": id
        }
      }
    ]);

    return messages;
  }
}
