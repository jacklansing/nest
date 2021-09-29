import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  readonly SANDBOX_MODE_ENABLED =
    this.configService.get('SENDGRID_SANDBOX_MODE') == 'true';

  async send(
    toAddress: string,
    fromAddress: string,
    templateId: string,
    dynamic_template_data: Record<string, string> = {},
  ) {
    const message = this.createMessage(
      toAddress,
      fromAddress,
      templateId,
      dynamic_template_data,
    );
    try {
      await sgMail.send(message);
      if (this.SANDBOX_MODE_ENABLED) console.info(message);
    } catch (e) {
      Logger.error(e);
    }
  }

  private createMessage(
    toAddress: string,
    fromAddress: string,
    templateId: string,
    dynamic_template_data: Record<string, string>,
  ) {
    return {
      to: toAddress,
      from: fromAddress,
      templateId,
      mailSettings: {
        sandboxMode: {
          enable: this.SANDBOX_MODE_ENABLED,
        },
      },
      dynamic_template_data,
    };
  }
}
