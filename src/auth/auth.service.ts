import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { ResetTokenService } from './reset-token.service';
import { User } from '.prisma/client';
import { ResetToken } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private resetTokenService: ResetTokenService,
  ) {}

  async googleLogin(user: User) {
    if (user) {
      return this.login(user);
    } else
      throw new BadRequestException('no user provided during google login');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.user({ email });
    if (!user) return null;
    const passwordMatches = await this.compareHash(user.password, password);
    if (user && passwordMatches) {
      delete user.password;
      return user;
    }
    return null;
  }

  async compareHash(hashedPassword: string, password: string) {
    return argon2.verify(hashedPassword, password);
  }

  async login(user: User) {
    const userRecord = await this.usersService.user({ email: user.email });
    const payload = { email: userRecord.email, sub: userRecord.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(userEmail: string) {
    const user = await this.usersService.user({ email: userEmail });
    if (user) {
      return this.resetTokenService.createToken(user);
    }
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const token = await this.resetTokenService.token({ resetToken });
    const user = await this.usersService.user({ id: token.userId });
    this.throwBadRequestOnNullTokenOrUser(token, user);
    this.checkTokenValidity(token, user);
    await this.updateUserWithNewPassword(newPassword, token);
    return true;
  }

  private async updateUserWithNewPassword(
    newPassword: string,
    token: ResetToken,
  ) {
    const newPasswordHash = await this.usersService.hashPassword(newPassword);
    await this.usersService.updateUser({
      where: { id: token.userId },
      data: { password: newPasswordHash },
    });

    await this.resetTokenService.updateToken({
      where: {
        resetToken: token.resetToken,
      },
      data: {
        wasUsed: true,
      },
    });
  }

  private throwBadRequestOnNullTokenOrUser(token: ResetToken, user: User) {
    if (token == null || user == null)
      throw new BadRequestException('token is expired or invalid');
  }

  private checkTokenValidity(token: ResetToken, user: User) {
    if (
      token.createdAt < user.updatedAt ||
      token.expiresAt < new Date() ||
      token.wasUsed
    )
      throw new BadRequestException('token has expired');
  }
}
