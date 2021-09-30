import { User } from '.prisma/client';
import {
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
  Body,
  UseFilters,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthMailService } from 'src/mail/auth/auth-mail.service';
import { UsersMailService } from 'src/mail/users/users-mail.service';
import { PrismaExceptionFilter } from 'src/prisma-exception.filter';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleUserDto } from './dto/google-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private authMailService: AuthMailService,
    private usersMailService: UsersMailService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() user: User) {
    return this.authService.login(user);
  }

  @Get('google-login')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return true;
  }

  @Get('google-redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Body(new ValidationPipe()) googleUser: GoogleUserDto) {
    if (googleUser.isNew) {
      this.usersMailService.sendRegisterConfirmation(googleUser);
    }
    return this.authService.googleLogin(googleUser);
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
