import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { ResetTokenService } from './reset-token.service';
import { PrismaService } from 'src/prisma.service';
import { MailModule } from 'src/mail/mail.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiry },
    }),
  ],
  providers: [
    PrismaService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    ResetTokenService,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
