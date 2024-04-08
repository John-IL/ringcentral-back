import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MessagesService } from '@/ringcentral/messages/messages.service';
import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/ringcentral/messages/dto/update-message.dto';


@ApiTags('ringcentral')
@Controller('ringcentral/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
 
  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}
