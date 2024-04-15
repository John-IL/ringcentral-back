import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ApiTags } from '@nestjs/swagger';
import { SearchChatDto } from './dto/search-chat.dto';
import axios from "axios";
import { Credential } from '@/ringcentral/messages/entities/credential.entity';

@ApiTags('ringcentral')
@Controller('ringcentral/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async create(@Body() createChatDto: CreateChatDto) {

    const api = process.env.NEW_BACK_URL + '/ring-central/credentials/all';
    const responseCredentials = await axios.get(api);
    const credentials: Credential[] = responseCredentials.data;

    return this.chatsService.create(createChatDto, credentials);
  }

  @Post('/search')
  findAll(@Body() searchChatDto: SearchChatDto) {
    const { phoneNumber, page, text } = searchChatDto;
    return this.chatsService.findAll(phoneNumber, page, text);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  @Get('/:id/files')
  getFilesByChatId(@Param('id') id: string) {
    return this.chatsService.getAllFilesByChat(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatsService.update(id, updateChatDto);
  }

  @Patch('/:id/messages/read-all')
  readAllMessages(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatsService.readAllMessages(id, updateChatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatsService.remove(+id);
  }
}
