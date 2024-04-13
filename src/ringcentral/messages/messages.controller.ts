import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MessagesService } from '@/ringcentral/messages/messages.service';
import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto.';
import { FindMessagesDto } from './dto/find-messages.dto';
import { MigrateMessagesDto } from './dto/migrate-messages.dto';


@ApiTags('ringcentral')
@Controller('ringcentral/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
 
  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Post('/by-chat')
  findAllByChatId(@Body() searchChatDto: SearchMessagesDto) {
    return this.messagesService.findAll(searchChatDto);
  }

  @Post('/search')
  findByText(@Body() searchChatDto: SearchMessagesDto) {
    return this.messagesService.findByText(searchChatDto);
  }

  @Post('/find')
  findOne(@Body() findMessageDto: FindMessagesDto) {
    return this.messagesService.findOne(findMessageDto);
  }

  @Post('/migrate')
  syncMessages(@Body() migrateMessageDto: MigrateMessagesDto) {
    return this.messagesService.migrate(migrateMessageDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}
