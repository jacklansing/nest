import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/users/decorators/user.decorator';
import { ReqUserDto } from 'src/users/dto/req-user.dto';
import { ChangeSubDto } from './dto/change-sub.dto';
import { CreateSubDto } from './dto/create-sub.dto';
import { PreviewChangeDto } from './dto/preview-change.dto';
import { StripeService } from './stripe-service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-customer')
  async createCustomer(@Body(new ValidationPipe()) reqUser: ReqUserDto) {
    return this.stripeService.createCustomer(reqUser);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createSubscription(
    @User() reqUser: ReqUserDto,
    @Body(new ValidationPipe()) createSubInput: CreateSubDto,
  ) {
    return this.stripeService.createSubscription(reqUser, createSubInput);
  }

  @UseGuards(JwtAuthGuard)
  @Post('preview-change')
  async previewChange(
    @User() reqUser: ReqUserDto,
    @Body(new ValidationPipe()) previewChangeInput: PreviewChangeDto,
  ) {
    return this.stripeService.previewProration(reqUser, previewChangeInput);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change')
  async changeSubscription(
    @User() reqUser: ReqUserDto,
    @Body(new ValidationPipe()) changeSubInput: ChangeSubDto,
  ) {
    return this.stripeService.changeSubscription(reqUser, changeSubInput);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancelSubscription(@User() reqUser: ReqUserDto) {
    return this.stripeService.cancelSubscription(reqUser);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reactivate-cancelled')
  async reactivateCancelledSubscription(@User() reqUser: ReqUserDto) {
    return this.stripeService.cancelSubscription(reqUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('setup-intent')
  async getSetupIntent(@User() reqUser: ReqUserDto) {
    return this.stripeService.createSetupIntent(reqUser);
  }

  @Post('/webhooks/stripe')
  async handleWebhook(@Req() req) {
    return this.stripeService.handleWebhook(req);
  }
}
