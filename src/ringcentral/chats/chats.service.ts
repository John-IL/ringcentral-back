import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Model, Types } from 'mongoose'
import { Chats, ChatsDocument } from './schema/chats.schema';
import { Messages, MessagesDocument } from '../messages/schema/messages.schema';

@Injectable()
export class ChatsService {

  constructor(
    @InjectModel(Chats.name) private readonly ChatsModule: Model<ChatsDocument>,
    @InjectModel(Messages.name) private readonly MessagesModule: Model<MessagesDocument>,
  ) { }

  async create(createChatDto: CreateChatDto): Promise<ChatsDocument>  {
    const { firstParticipant, secondParticipant } = createChatDto;
    const firstNumber = firstParticipant.phoneNumber;
    const secondNumber = secondParticipant.phoneNumber;

    const existingChat = this.findChatPhoneNumbers(firstNumber, secondNumber);

    if (existingChat) {
      throw new ConflictException('This chat has already been created');
    }

    const created = await this.ChatsModule.create(createChatDto)
    return created;
  }

  async findAll(phoneNumber: string, page: number) {
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const chatsWithLastMessageAndUnreadCount = await this.ChatsModule.aggregate([
      {
        $match: {
          $or: [
            { 'firstParticipant.phoneNumber': phoneNumber },
            { 'secondParticipant.phoneNumber': phoneNumber }
          ]
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$chatId', '$$chatId'] },
                direction: 'INBOUND',
                readBy: { $exists: false }
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
          let: { chatId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$chatId', '$$chatId'] },
              },
            },
            {
              $sort: { createdAt: -1 }
            },
            {
              $limit: 1
            }
          ],
          as: 'lastMessage'
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1, 'creationTime': -1 }
      },
      {
        $project: {
          _id: 1,
          firstParticipant: 1,
          secondParticipant: 1,
          type: 1,
          creationTime: 1,
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

  async findOne(id: string) : Promise<ChatsDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat id');
    }

    const chat = await this.ChatsModule.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async findChatPhoneNumbers(firstPhoneNumber: string, secondPhoneNumber: string): Promise<ChatsDocument | null>  {

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

  async update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
