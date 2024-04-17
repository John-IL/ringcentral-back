import { Injectable } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketsService {
    @WebSocketServer() server: Server;

    sendNotification(channel: string, data: any) {
        this.server.emit(channel, data);
    }
}
