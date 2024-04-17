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
      console.log('Client connected');


      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });


    });
  }

  sendNotification(channel: string, data: any) {
    this.server.emit(channel, data);
  }
}
