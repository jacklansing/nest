import { Module } from '@nestjs/common';
import { AuthMailService } from './auth/auth-mail.service';
import { MailService } from './mail.service';
import { SubscriptionsMailService } from './subscriptions/subscriptions-mail.service';
import { UsersMailService } from './users/users-mail.service';

@Module({
  providers: [
    MailService,
    UsersMailService,
    AuthMailService,
    SubscriptionsMailService,
  ],
  exports: [
    MailService,
    UsersMailService,
    AuthMailService,
    SubscriptionsMailService,
  ],
})
export class MailModule {}
