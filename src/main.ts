import {
  ValidationPipe,
  BadRequestException,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import * as bodyParser from 'express';
config();

function useRawBodyForStripeWebhooks(app: INestApplication) {
  app.use(
    '/subscriptions/webhooks/stripe',
    bodyParser.raw({ type: 'application/json' }),
  );
}

function useGlobalPipeFilters(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(validationErrors);
      },
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  useRawBodyForStripeWebhooks(app);
  useGlobalPipeFilters(app);
  const port = configService.get('PORT');
  await app.listen(port || 3000);
}
bootstrap();
