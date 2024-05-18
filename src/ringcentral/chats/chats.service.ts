import * as AWS from 'aws-sdk';
import axios from "axios";

import { Model, Types } from 'mongoose'


import { InjectModel } from '@nestjs/mongoose';
import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { UpdateChatDto } from '@/ringcentral/chats/dto/update-chat.dto';
import { Chats, ChatsDocument } from '@/ringcentral/chats/schema/chats.schema';
import { Messages, MessagesDocument } from '@/ringcentral/messages/schema/messages.schema';
import { Credential } from '@/ringcentral/messages/entities/credential.entity';
import { MessagesModule } from '@/ringcentral/messages/messages.module';
import { Attachments } from '@/ringcentral/messages/entities/attachment.entity';
import { CreateChatDto } from '@/ringcentral/chats/dto/create-chat.dto';
import { WebsocketsGateway } from "@/websockets/websockets.gateway";
import { SearchChatDto } from './dto/search-chat.dto';

@Injectable()
export class ChatsService {

  constructor(
    @InjectModel(Chats.name) private readonly ChatsModule: Model<ChatsDocument>,
    @InjectModel(Messages.name) private readonly MessagesModule: Model<MessagesDocument>,
    private readonly websocketsGateway: WebsocketsGateway,
  ) { }

  async create(createChatDto: CreateChatDto, credentials: Credential[]): Promise<ChatsDocument> {

    const { firstNumber, secondNumber } = createChatDto;

    const existingChat = await this.findChatPhoneNumbers(firstNumber, secondNumber);

    if (existingChat) {
      if (existingChat.blockedBy) {
        throw new ConflictException('This chat was blocked by ' + existingChat.blockedBy.name);
      }

      return existingChat;

    }

    const firstModule = credentials.find(module => module.number == firstNumber);
    const secondModule = credentials.find(module => module.number == secondNumber);

    if ((firstModule && secondModule) || (!firstModule && !secondModule)) {
      throw new ConflictException('This chat is internal');
    }

    let leadPhoneNumber = null;

    if (firstModule) {
      createChatDto.credentialId = firstModule.id;
      createChatDto.credentialPhoneNumber = firstModule.number;

      createChatDto.leadPhoneNumber = secondNumber;
      leadPhoneNumber = secondNumber;
      createChatDto.searchPhoneNumber = secondNumber.replace(/\D/g, '');
    }

    if (secondModule) {
      createChatDto.credentialId = secondModule.id;
      createChatDto.credentialPhoneNumber = secondModule.number;

      createChatDto.leadPhoneNumber = firstNumber;
      leadPhoneNumber = firstNumber;
      createChatDto.searchPhoneNumber = firstNumber.replace(/\D/g, '');
    }

    try {
      const api = process.env.NEW_BACK_URL + '/ring-central/lead/index';
      const payload = {
        leadNumber: leadPhoneNumber
      }
      const { data } = await axios.post(api, payload);

      if (data && data.length == 1) {
        const leadInfo = data[0];
        createChatDto.leadId = leadInfo.id;
        createChatDto.leadName = this.getLeadName(leadInfo);
      }
    } catch (error) {
    }

    const created = await this.ChatsModule.create(createChatDto)

    this.websocketsGateway.sendNotification('notification-new-chat', created);

    return created;
  }

  async findAll(searchChatDto: SearchChatDto) {
    let { credentialId, page, text, filterAll } = searchChatDto;
    const pageSize = 15;
    const skip = (page - 1) * pageSize;

    let matchQuery: any = {
      "$and": [
        { "credentialId": credentialId },
        { "isBlocked": false }
      ]
    };

    let chatWithMessages = [];

    if (text && text.trim() !== "") {
      const newSearchText = text.replace(/[^\w\s]/g, '');

      matchQuery["$and"].push({
        '$or': [
          { 'leadName': { $regex: newSearchText, $options: 'i' } },
          { "searchPhoneNumber": { $regex: newSearchText, $options: 'i' } },
        ]
      });

      let matchQueryMessage: any = {
        "$and": [
          { "chat.credentialId": credentialId },
          { "chat.isBlocked": false },
          { "subject": { $regex: text, $options: 'i' } },
        ]
      };

      chatWithMessages = await this.MessagesModule.aggregate([
        {
          $lookup: {
            from: 'chats',
            localField: 'chatId',
            foreignField: '_id',
            as: 'chat',
          },
        },
        {
          $unwind: '$chat',
        },

        {
          $match: matchQueryMessage
        },

        {
          $skip: skip
        },
        {
          $limit: pageSize
        }
      ]);

    }

    if (filterAll == 'unread') {
      matchQuery["$and"].push({
        "unreadCount": { $gt: 0 }
      });
    }

    const chatsWithLastMessage = await this.ChatsModule.aggregate([

      {
        $match: matchQuery
      },
      {
        $project: {
          _id: 1,
          leadPhoneNumber: 1,
          leadName: 1,
          createdAt: 1,
          createdBy: 1,
          leadId: 1,
          clientAccountId: 1,

          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.creationTime': -1, 'createdAt': -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: pageSize
      }
    ]);

    return {
      chats: chatsWithLastMessage,
      messages: chatWithMessages
    };
  }

  async findOne(id: string): Promise<ChatsDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat id');
    }

    const chat = await this.ChatsModule.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async findChatPhoneNumbers(firstNumber: string, secondNumber: string): Promise<ChatsDocument | null> {

    const chat = await this.ChatsModule.findOne({
      $or: [
        {
          credentialPhoneNumber: firstNumber,
          leadPhoneNumber: secondNumber
        },
        {
          leadPhoneNumber: firstNumber,
          credentialPhoneNumber: secondNumber
        }
      ]
    }).exec();

    return chat;
  }

  async getAllFilesByChat(chatId: string): Promise<MessagesModule[]> {

    const files = await this.MessagesModule.aggregate([
      { $match: { chatId: new ObjectId(chatId) } },
      { $sort: { creationTime: -1 } },
      { $unwind: "$attachments" },
      { $project: { _id: 0, file: "$attachments" } }
    ]);

    const fileList: Attachments[] = files.map(message => message.file);

    const s3 = new AWS.S3();
    for (let file of fileList) {
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: file.recordUrl,
        Expires: 3600,
      };

      const signedUrl = await s3.getSignedUrlPromise('getObject', params);
      file.route = signedUrl;
    }

    return fileList ?? [];
  }

  async update(id: string, updateChatDto: UpdateChatDto) {

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat id');
    }

    await this.ChatsModule.updateOne({ _id: id }, updateChatDto)
    const chat = await this.ChatsModule.findById(id);
    this.websocketsGateway.sendNotification('notification-update-chat', chat);

    return chat;
  }

  async readAllMessages(id: string, updateChatDto: UpdateChatDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat id');
    }

    const nextUpdatedDocuments = await this.MessagesModule.find({ chatId: new ObjectId(id), readStatus: "Unread" }).select('_id');

    if (nextUpdatedDocuments.length > 0) {

      await this.ChatsModule.updateOne({ _id: id }, {
        unreadCount: 0
      });

      const updatedDocumentIds = nextUpdatedDocuments.map(doc => doc._id);

      await this.MessagesModule.updateMany({ chatId: new ObjectId(id), readStatus: "Unread" }, updateChatDto);

      const updatedDocuments = await this.MessagesModule.find({ _id: { $in: updatedDocumentIds } }).select('_id readBy');

      this.websocketsGateway.sendNotification('notification-read-all-messages', { chatId: id });
      this.websocketsGateway.sendNotification('notification-read-all-messages-update', { chatId: id, updatedDocuments });
    }
  }

  async getTotalUnreadMessages(credentialId2: Number): Promise<number> {
    const newCredentialId: Number = Number(credentialId2);
    const aggregateQuery = [
      {
        $match: { credentialId: newCredentialId, isBlocked: false }
      },
      {
        $group: {
          _id: "$credentialId",
          totalUnreadMessages: { $sum: "$unreadCount" }
        }
      }
    ];

    const result = await this.ChatsModule.aggregate(aggregateQuery).exec();

    if (result.length > 0) {
      return result[0].totalUnreadMessages;
    } else {
      return 0;
    }
  }

  async getAllMessagesUnread(): Promise<number> {
    const totalUnreadCount = await this.ChatsModule.aggregate([
      {
        $match: {
          credentialId: { $in: [20, 41] }, isBlocked: false
        }
      },
      {
        $group: {
          _id: null,
          totalUnreadCount: { $sum: '$unreadCount' }
        }
      }
    ]);

    return totalUnreadCount.length > 0 ? totalUnreadCount[0].totalUnreadCount : 0;

  }

  async getAllMessagesUnreadByLeadPhone(leadPhone: string, credentialId: number): Promise<number> {
    const chat = await this.ChatsModule.findOne({ leadPhoneNumber: leadPhone, credentialId, isBlocked: false });
    if (chat) {
      return chat.unreadCount ?? 0;
    }
    return 0;

  }

  async getAllMessagesUnreadGroup(): Promise<{ credentialId: number; totalUnreadCount: number }[]> {
    const totalUnreadCounts = await this.ChatsModule.aggregate([
      {
        $match: {
          credentialId: { $in: [20, 41] },
          isBlocked: false
        }
      },
      {
        $group: {
          _id: '$credentialId',
          totalUnreadCount: { $sum: '$unreadCount' }
        }
      },
      {
        $project: {
          _id: 0,
          credentialId: '$_id',
          totalUnreadCount: 1
        }
      }
    ]);

    return totalUnreadCounts;
  }

  getLeadName(lead: any) {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name} ${lead.last_name}`;
    }

    if (lead.nickname) {
      return lead.nickname;
    }

    return "Unknown";
  }
}
