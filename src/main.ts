import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as AWS from 'aws-sdk';
import * as cors from 'cors';

async function bootstrap() {
  
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

  app.setGlobalPrefix('api');

  // app.enableCors();
  app.use(cors());

  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });

  await app.listen(3000);
}

bootstrap();
