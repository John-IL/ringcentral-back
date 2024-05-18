import axios from "axios";
import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';

import { ChatsService } from '@/ringcentral/chats/chats.service';
import { CreateChatDto } from '@/ringcentral/chats/dto/create-chat.dto';
import { UpdateChatDto } from '@/ringcentral/chats/dto/update-chat.dto';
import { SearchChatDto } from '@/ringcentral/chats/dto/search-chat.dto';
import { Credential } from '@/ringcentral/messages/entities/credential.entity';
import { FindClientChatDto } from '@/ringcentral/chats/dto/find-client-chat.dto';
import { AuthGuard } from '@/ringcentral/auth.guard';
import { CounterChatDto } from '@/ringcentral/chats/dto/counter-chat.dto';

@ApiTags('ringcentral')
@Controller('ringcentral/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() createChatDto: CreateChatDto) {

    const api = process.env.NEW_BACK_URL + '/ring-central/get-ring-central-credentials';
    const { data } = await axios.post(api);
    const credentials: Credential[] = data.data;

    return this.chatsService.create(createChatDto, credentials);
  }

  @UseGuards(AuthGuard)
  @Post('/search')
  findAll(@Body() searchChatDto: SearchChatDto) {
    return this.chatsService.findAll(searchChatDto);
  }

  @UseGuards(AuthGuard)
  @Post('/client')
  findChatClient(@Body() findClientChatDto: FindClientChatDto) {
    const { modulePhoneNumber, clientPhoneNumber } = findClientChatDto;
    return this.chatsService.findChatPhoneNumbers(modulePhoneNumber, clientPhoneNumber);
  }

  @UseGuards(AuthGuard)
  @Get('/unread-all')
  getAllMessagesUnread() {
    return this.chatsService.getAllMessagesUnread();
  }

  @UseGuards(AuthGuard)
  @Get('/unread-all-group')
  getAllMessagesUnreadGroup() {
    return this.chatsService.getAllMessagesUnreadGroup();
  }

  @UseGuards(AuthGuard)
  @Post('/unread-lead')
  getAllMessagesUnreadByLeadPhone(@Body() SearchChatDto: CounterChatDto) {
    const { phoneNumber, credentialId } = SearchChatDto;
    return this.chatsService.getAllMessagesUnreadByLeadPhone(phoneNumber, credentialId);
  }



  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Get('/unread/:credentialId')
  getTotalUnreadMessages(@Param('credentialId') credentialId: Number) {
    return this.chatsService.getTotalUnreadMessages(credentialId);
  }

  @UseGuards(AuthGuard)
  @Get('/:id/files')
  getFilesByChatId(@Param('id') id: string) {
    return this.chatsService.getAllFilesByChat(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatsService.update(id, updateChatDto);
  }

  @UseGuards(AuthGuard)
  @Patch('/:id/messages/read-all')
  readAllMessages(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatsService.readAllMessages(id, updateChatDto);
  }

}
