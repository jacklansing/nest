import { User, ResetToken, Prisma } from '.prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as uuid from 'uuid';

@Injectable()
export class ResetTokenService {
  constructor(private prisma: PrismaService) {}

  async token(
    tokenWhereInput: Prisma.ResetTokenWhereUniqueInput,
  ): Promise<ResetToken | null> {
    return this.prisma.resetToken.findUnique({ where: tokenWhereInput });
  }

  async createToken(user: User): Promise<ResetToken> {
    const resetToken = uuid.v4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    return this.prisma.resetToken.create({
      data: {
        userId: user.id,
        resetToken,
        expiresAt,
      },
    });
  }

  async updateToken(params: {
    where: Prisma.ResetTokenWhereUniqueInput;
    data: Prisma.ResetTokenUpdateInput;
  }): Promise<ResetToken> {
    const { where, data } = params;
    return this.prisma.resetToken.update({
      data,
      where,
    });
  }
}
