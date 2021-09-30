import { Prisma, User } from '.prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Profile } from 'passport';
import * as argon2 from 'argon2';
import { PasswordGenerator } from 'src/helpers/password-generator';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithAggregationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const password = await this.hashPassword(data.password);
    const newUser = await this.prisma.user.create({
      data: { ...data, password },
    });
    delete newUser.password;
    return newUser;
  }

  async findOrCreateFromPassportProfile(
    profile: Profile,
  ): Promise<User & { isNew: boolean }> {
    const email = this.emailFromPassportProfile(profile);
    const user = await this.user({ email });
    if (user) {
      return { ...user, isNew: false };
    }
    const data = this.userDataFromPassportProfile(profile);
    const newUser = await this.createUser(data);
    return { ...newUser, isNew: true };
  }

  private userDataFromPassportProfile(
    profile: Profile,
  ): Prisma.UserCreateInput {
    return {
      email: this.emailFromPassportProfile(profile),
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      password: PasswordGenerator.complexPassword(),
    };
  }

  private emailFromPassportProfile(profile: Profile) {
    return profile.emails[0].value;
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
