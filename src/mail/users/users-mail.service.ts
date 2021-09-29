import { User } from '.prisma/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail.service';

@Injectable()
export class UsersMailService {
  constructor(
    private mailService: MailService,
    private configService: ConfigService,
  ) {}
  sendRegisterConfirmation(user: User) {
    this.mailService.send(
      user.email,
      this.configService.get('SENDGRID_DEFAULT_FROM_ADDRESS'),
      this.configService.get('SG_USER_WELCOME_TEMPLATE_ID'),
      {
        firstName: user.firstName,
        appName: this.configService.get('APPLICATION_NAME'),
      },
    );
  }
}
