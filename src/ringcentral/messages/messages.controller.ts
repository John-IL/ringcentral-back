import { Body, Controller, Get, Post } from '@nestjs/common';

import { MessagesService } from './messages.service';

import { CreateMessageDto, ListMessageDto } from './dto/message.dto';

@Controller('ringcentral/messages')
export class MessagesController {

    constructor(
        private messageService: MessagesService
    ) { }

    @Get()
    getAll(@Body() request: ListMessageDto) {
        return this.messageService.getAll(request);
    }

    @Post()
    create(@Body() request: CreateMessageDto) {
        this.messageService.create(request);
        return 1;
        // return this.messageService.create();
    }
}
