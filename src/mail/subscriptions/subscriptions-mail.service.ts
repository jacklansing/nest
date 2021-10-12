import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail.service';

@Injectable()
export class SubscriptionsMailService {
  constructor(
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  sendPaymentFailed(email: string) {
    this.mailService.send(
      email,
      this.configService.get('SENDGRID_DEFAULT_FROM_ADDRESS'),
      this.configService.get('SG_STRIPE_PAYMENT_FAILED'),
      {},
    );
  }

  sendInvoiceUpcoming(email: string) {
    this.mailService.send(
      email,
      this.configService.get('SENDGRID_DEFAULT_FROM_ADDRESS'),
      this.configService.get('SG_STRIPE_PAYMENT_REMINDER'),
      {},
    );
  }
}
