import { Controller, Post, Body, Patch, Param, Res, Req, Headers, UseGuards, Get, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@/ringcentral/auth.guard';

import { MessagesService } from '@/ringcentral/messages/messages.service';
import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto.';
import { FindMessagesDto } from './dto/find-messages.dto';
import { MigrateMessagesDto } from './dto/migrate-messages.dto';
import { ImportantMessageDto } from './dto/important-message.dto';
import { SearchTopicMessagesDto } from '@/ringcentral/messages/dto/search-topic-message.dto';

@ApiTags('ringcentral')
@Controller('ringcentral/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @UseGuards(AuthGuard)
  @Post('/by-chat')
  findAllByChatId(@Body() searchChatDto: SearchMessagesDto) {
    return this.messagesService.findAll(searchChatDto);
  }

  @UseGuards(AuthGuard)
  @Post('/search')
  findByText(@Body() searchChatDto: SearchMessagesDto) {
    return this.messagesService.findByText(searchChatDto);
  }

  @UseGuards(AuthGuard)
  @Post('/asign-important')
  asignImportantMessage(@Body() importantMessageDto: ImportantMessageDto) {
    return this.messagesService.asignImportantMessage(importantMessageDto);
  }

  @UseGuards(AuthGuard)
  @Post('/find')
  findOne(@Body() findMessageDto: FindMessagesDto) {
    return this.messagesService.findOne(findMessageDto);
  }

  @UseGuards(AuthGuard)
  @Post('/migrate')
  syncMessages(@Body() migrateMessageDto: MigrateMessagesDto) {
    return this.messagesService.migrate(migrateMessageDto);
  }

  @UseGuards(AuthGuard)
  @Post('/unread-messages-lead')
  unreadByLeadPhone(@Body() migrateMessageDto: MigrateMessagesDto) {
    return 1;
  }

  @UseGuards(AuthGuard)
  @Post('/topic/message')
  getAnswersByMessageTopic(@Body() searchMessageDto: SearchTopicMessagesDto) {
    return this.messagesService.getAnswersByMessageTopic(searchMessageDto);
  }

  @UseGuards(AuthGuard)
  @Get('/topic/message/:id')
  getAnswersByMessageTopicId(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.getAnswersByMessageTopicId(id);
  }

  @UseGuards(AuthGuard)
  @Get('/credential/:id')
  getAnswersByCredentialId(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.getAnswersByCredentialId(id);
  }


  @Post('/webhooks')
  async webhook(@Headers('validation-token') validationToken: string, @Req() request: Request, @Res() response: Response) {
    this.messagesService.webhook(request);
    
    if (validationToken) {
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Validation-Token', validationToken);
      return response.status(200).send();
    } else {
      return response.status(200).send();
    }
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

}
