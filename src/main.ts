import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe)

  const config = new DocumentBuilder()
    .setTitle('AMG Nest Back')
    .setDescription('Documentation for Nest')
    .setVersion('1.0')
    .addTag('ringcentral')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, document);


  await app.listen(3000);
}

bootstrap();
