import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { WebsocketsService } from './websockets.service';

@WebSocketGateway()
export class WebsocketsGateway implements OnModuleInit {

  @WebSocketServer()
  public server: Server;

  constructor(private readonly websocketsService: WebsocketsService) { }

  onModuleInit() {
    this.server.on('connection', (socket: Socket) => {

      socket.on('disconnect', () => {
      });

    });
  }

  sendNotification(channel: string, data: any) {
    this.server.emit(channel, data);
  }
}
