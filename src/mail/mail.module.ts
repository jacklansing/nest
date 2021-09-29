import { Module } from '@nestjs/common';
import { AuthMailService } from './auth/auth-mail.service';
import { MailService } from './mail.service';
import { UsersMailService } from './users/users-mail.service';

@Module({
  providers: [MailService, UsersMailService, AuthMailService],
  exports: [MailService, UsersMailService, AuthMailService],
})
export class MailModule {}
