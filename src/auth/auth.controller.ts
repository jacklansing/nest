import {
  Controller,
  Post,
  UseGuards,
  Request,
  ValidationPipe,
  Body,
  UseFilters,
} from '@nestjs/common';
import { AuthMailService } from 'src/mail/auth/auth-mail.service';
import { PrismaExceptionFilter } from 'src/prisma-exception.filter';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private authMailService: AuthMailService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('forgot-password')
  @UseFilters(new PrismaExceptionFilter())
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordInput: ForgotPasswordDto,
  ) {
    const resetToken = await this.authService.forgotPassword(
      forgotPasswordInput.userEmail,
    );

    if (resetToken) {
      this.authMailService.sendForgotPassword(
        forgotPasswordInput.userEmail,
        resetToken,
      );
    }

    return true;
  }

  @Post('reset-password')
  @UseFilters(new PrismaExceptionFilter())
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordInput: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(
      resetPasswordInput.resetToken,
      resetPasswordInput.newPassword,
    );

    return {
      statusCode: 200,
      message: 'success',
    };
  }
}
