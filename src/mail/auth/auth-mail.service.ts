import { ResetToken } from '.prisma/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail.service';

@Injectable()
export class AuthMailService {
  constructor(
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  sendForgotPassword(email: string, { resetToken }: ResetToken) {
    this.mailService.send(
      email,
      this.configService.get('SENDGRID_DEFAULT_FROM_ADDRESS'),
      this.configService.get('SG_FORGOT_PASSWORD_TEMPLATE_ID'),
      {
        tokenUrl: resetToken,
      },
    );
  }
}
