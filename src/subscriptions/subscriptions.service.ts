import { Injectable } from '@nestjs/common';
import { Prisma, Subscription, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async subscription(
    subscriptionWhereInput: Prisma.SubscriptionWhereUniqueInput,
  ): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: subscriptionWhereInput,
    });
  }

  async subscriptionWhere(
    subscriptionWhereInput: Prisma.SubscriptionWhereInput,
  ): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: subscriptionWhereInput,
    });
  }

  async subscriptionWithUser(
    subscriptionWhereInput: Prisma.SubscriptionWhereUniqueInput,
  ): Promise<(Subscription & { user: User }) | null> {
    return this.prisma.subscription.findUnique({
      where: subscriptionWhereInput,
      include: {
        user: true,
      },
    });
  }

  async subscriptions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SubscriptionWhereUniqueInput;
    where?: Prisma.SubscriptionWhereInput;
    orderBy?: Prisma.SubscriptionOrderByWithAggregationInput;
  }): Promise<Subscription[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.subscription.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createSubscription(
    data: Prisma.SubscriptionCreateInput,
  ): Promise<Subscription> {
    const newSubscription = await this.prisma.subscription.create({
      data: data,
    });
    return newSubscription;
  }

  async updateSubscription(params: {
    where: Prisma.SubscriptionWhereUniqueInput;
    data: Prisma.SubscriptionUpdateInput;
  }): Promise<Subscription> {
    const { where, data } = params;
    return this.prisma.subscription.update({
      data,
      where,
    });
  }

  async deleteSubscription(
    where: Prisma.SubscriptionWhereUniqueInput,
  ): Promise<Subscription> {
    return this.prisma.subscription.delete({
      where,
    });
  }
}
