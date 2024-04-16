import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Model, Types } from 'mongoose'
import { Chats, ChatsDocument } from './schema/chats.schema';
import { Messages, MessagesDocument } from '../messages/schema/messages.schema';
import { Credential } from '@/ringcentral/messages/entities/credential.entity';
import { TypeChat } from "@/ringcentral/chats/schema/chats.schema"
import { ObjectId } from 'mongodb';
import { MessagesModule } from '../messages/messages.module';
import { Attachments } from '../messages/entities/attachment.entity';
import * as AWS from 'aws-sdk';
@Injectable()
export class ChatsService {

  constructor(
    @InjectModel(Chats.name) private readonly ChatsModule: Model<ChatsDocument>,
    @InjectModel(Messages.name) private readonly MessagesModule: Model<MessagesDocument>,
  ) { }

  async create(createChatDto: CreateChatDto, credentials: Credential[]): Promise<ChatsDocument> {
    const { firstParticipant, secondParticipant } = createChatDto;
    const firstNumber = firstParticipant.phoneNumber;
    const secondNumber = secondParticipant.phoneNumber;

    const existingChat = await this.findChatPhoneNumbers(firstNumber, secondNumber);

    if (existingChat) {
      throw new ConflictException('This chat has already been created');
    }

    createChatDto.type = TypeChat.LEAD;

    const firstModule = credentials.find(module => module.number_format == firstNumber);
    const secondModule = credentials.find(module => module.number_format == secondNumber);

    if (firstModule && secondModule) {
      createChatDto.type = TypeChat.INTERNAL;

      if (firstModule.number_format == secondModule.number_format) {
        createChatDto.type = TypeChat.YOU;
      }
    }

    if (firstModule) {
      createChatDto.firstParticipant.name = firstModule.rc_name;
    }

    if (secondModule) {
      createChatDto.secondParticipant.name = secondModule.rc_name;
    }

    const created = await this.ChatsModule.create(createChatDto)
    return created;
  }

  async findAll(phoneNumber: string, page: number, searchText: string) {
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    let matchQuery: any = {
      "$or": [
        {
          "$and":
            [
              { "firstParticipant.phoneNumber": phoneNumber },
              { "isBlocked": false }
            ]
        },
        {
          "$and":
            [
              { "secondParticipant.phoneNumber": phoneNumber },
              { "isBlocked": false }
            ]
        },
      ]
    };

    if (searchText && searchText.trim() !== "") {
      const newSearchText = searchText.replace(/[^\w\s]/g, '');

      matchQuery["$or"][0]["$and"].push({
        '$or': [
          { 'secondParticipant.name': { $regex: newSearchText, $options: 'i' } },
          { "secondParticipant.searchPhoneNumber": { $regex: newSearchText, $options: 'i' } },
        ]
      });

      matchQuery["$or"][1]["$and"].push({
        '$or': [
          { 'firstParticipant.name': { $regex: newSearchText, $options: 'i' } },
          { "firstParticipant.searchPhoneNumber": { $regex: newSearchText, $options: 'i' } },
        ]
      });
    }

    const chatsWithLastMessageAndUnreadCount = await this.ChatsModule.aggregate([
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$chatId', '$$chatId'] },
                direction: 'Inbound',
                readStatus: 'Unread'
              },
            },
            {
              $count: 'unreadCount'
            }
          ],
          as: 'unreadMessages'
        }
      },
      {
        $addFields: {
          unreadCount: {
            $cond: {
              if: { $isArray: '$unreadMessages' },
              then: { $arrayElemAt: ['$unreadMessages.unreadCount', 0] },
              else: 0
            }
          }
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$chatId', '$$chatId'] },
              },
            },
            {
              $sort: { creationTime: -1 }
            },
            {
              $limit: 1
            }
          ],
          as: 'lastMessage'
        }
      },
      {
        $sort: { 'lastMessage.creationTime': -1, 'createdAt': -1 }
      },
      {
        $project: {
          _id: 1,
          firstParticipant: 1,
          secondParticipant: 1,
          type: 1,
          createdAt: 1,
          createdBy: 1,

          lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
          unreadCount: 1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: pageSize
      }
    ]);

    return chatsWithLastMessageAndUnreadCount;
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

  async findChatPhoneNumbers(firstPhoneNumber: string, secondPhoneNumber: string): Promise<ChatsDocument | null> {

    const chat = await this.ChatsModule.findOne({
      $or: [
        {
          'firstParticipant.phoneNumber': firstPhoneNumber,
          'secondParticipant.phoneNumber': secondPhoneNumber
        },
        {
          'firstParticipant.phoneNumber': secondPhoneNumber,
          'secondParticipant.phoneNumber': firstPhoneNumber
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

    return this.ChatsModule.updateOne({ _id: id }, updateChatDto);
  }

  async readAllMessages(id: string, updateChatDto: UpdateChatDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat id');
    }

    return this.MessagesModule.updateMany({ chatId: new ObjectId(id) }, updateChatDto);
  }

  async getTotalUnreadMessages(phoneNumber: string): Promise<number> {
    const aggregateQuery = [
      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat',
        },
      },
      { $unwind: '$chat' },
      {
        $match: {
          $or: [
            { 'chat.firstParticipant.phoneNumber': phoneNumber },
            { 'chat.secondParticipant.phoneNumber': phoneNumber },
          ],
          'readStatus': 'Unread',
          'direction': 'Inbound'
        },
      },
      { $count: 'totalUnreadMessages' },
    ];

    const result = await this.MessagesModule.aggregate(aggregateQuery).exec();
    if (result.length > 0) {
      return result[0].totalUnreadMessages;
    } else {
      return 0;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
