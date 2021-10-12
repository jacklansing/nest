import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { PrismaService } from 'src/prisma.service';
import { StripeService } from './stripe-service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [MailModule],
  providers: [StripeService, SubscriptionsService, PrismaService],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
