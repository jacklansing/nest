import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsMailService } from 'src/mail/subscriptions/subscriptions-mail.service';
import { ReqUserDto } from 'src/users/dto/req-user.dto';
import { Stripe } from 'stripe';
import { ChangeSubDto } from './dto/change-sub.dto';
import { CreateSubDto } from './dto/create-sub.dto';
import { PreviewChangeDto } from './dto/preview-change.dto';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class StripeService {
  private readonly stripe = new Stripe(
    this.configService.get('STRIPE_API_KEY'),
    {
      apiVersion: '2020-08-27',
    },
  );
  private readonly SUBSCRIPTION_TYPES = {
    [this.configService.get('SUBSCRIPTION_BASIC_PRICE_ID')]: 'basic',
    [this.configService.get('SUBSCRIPTION_PREMIUM_PRICE_ID')]: 'premium',
    [this.configService.get('SUBSCRIPTION_PRO_PRICE_ID')]: 'pro',
  };
  private readonly TWO_DAY_GRACE_PERIOD = 172_800;
  private readonly FIVE_MINUTE_GRACE_PERIOD = 300;

  constructor(
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
    private subscriptionsMailService: SubscriptionsMailService,
  ) {}

  async createCustomer({ email }: ReqUserDto) {
    return this.stripe.customers.create({ email });
  }

  async createSubscription(
    user: ReqUserDto,
    { priceId, customerId }: CreateSubDto,
  ) {
    const price = priceId;
    const customer = customerId;
    const subscription = (await this.stripe.subscriptions.create({
      customer: customer,
      items: [
        {
          price,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })) as Stripe.Subscription & {
      latest_invoice: Stripe.Invoice & { payment_intent: Stripe.PaymentIntent };
    };

    const latest_invoice = subscription.latest_invoice;
    const payment_intent = latest_invoice.payment_intent;
    await this.subscriptionsService.createSubscription({
      id: subscription.id,
      productId: subscription.items.data[0].price.product as string,
      priceId: price,
      customerId: customer,
      status: subscription.status,
      type: this.SUBSCRIPTION_TYPES[price],
      billingCycleAnchor: subscription.billing_cycle_anchor,
      currentPeriodEnd:
        subscription.billing_cycle_anchor + this.TWO_DAY_GRACE_PERIOD,
      user: {
        connect: {
          id: user.userId,
        },
      },
    });
    return {
      subscriptionId: subscription.id,
      clientSecret: payment_intent.client_secret,
    };
  }

  async previewProration(user: ReqUserDto, { newPriceId }: PreviewChangeDto) {
    const subscriptionId = await this.subscriptionIdForUser(user);
    const proration_date = Math.floor(Date.now() / 1000);
    const subscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
    );
    const items = [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ];
    const invoice = await this.stripe.invoices.retrieveUpcoming({
      customer: subscription.customer as string,
      subscription: subscription.id as string,
      subscription_items: items,
      subscription_proration_date: proration_date,
    });
    return invoice;
  }

  async changeSubscription(
    user: ReqUserDto,
    { prorationDateTimestamp, newPriceId }: ChangeSubDto,
  ) {
    const proration_date = this.withinGracePeriodOrNew(
      prorationDateTimestamp,
      this.FIVE_MINUTE_GRACE_PERIOD,
    );
    const subscriptionId = await this.subscriptionIdForUser(user);
    const subscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
    );
    await this.stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_date,
    });
  }

  private withinGracePeriodOrNew(time: number, grace_period: number): number {
    if (time > time + grace_period) {
      time = Math.floor(Date.now() / 1000);
    }
    return time;
  }

  async cancelSubscription(user: ReqUserDto) {
    const subscriptionId = await this.subscriptionIdForUser(user);
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async reactivateCancelledSubscription(user: ReqUserDto) {
    const subscriptionId = await this.subscriptionIdForUser(user);
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  private async subscriptionIdForUser(user: ReqUserDto) {
    const { id: subscriptionId } =
      await this.subscriptionsService.subscriptionWhere({
        userId: user.userId,
      });
    return subscriptionId;
  }

  async createSetupIntent(reqUser: ReqUserDto) {
    const subscriptionRecord =
      await this.subscriptionsService.subscriptionWhere({
        userId: reqUser.userId,
      });
    const { client_secret } = await this.stripe.setupIntents.create({
      customer: subscriptionRecord.customerId,
    });
    return {
      client_secret,
    };
  }

  private readonly WEBHOOK_EVENT_HANDLERS = {
    'invoice.upcoming': this.handleInvoiceUpcoming,
    'invoice.payment_succeeded': this.handleInvoicePaymentSucceeded,
    'invoice.paid': this.handleInvoicePaid,
    'invoice.payment_failed': this.handleInvoicePaymentFailed,
    'payment_method.attached': this.handlePaymentMethodAttached,
    'customer.subscription.updated': this.handleCustomerSubscriptionUpdated,
  };

  async handleWebhook(req) {
    const event = this.stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      this.configService.get('STRIPE_WEBHOOK_SECRET'),
    );
    const handler = this.WEBHOOK_EVENT_HANDLERS[event.type];
    handler && handler.call(this, event);
  }

  async handleInvoiceUpcoming(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription: string;
    };
    const subscriptionRecord =
      await this.subscriptionsService.subscriptionWithUser({
        id: invoice.subscription,
      });
    this.subscriptionsMailService.sendInvoiceUpcoming(
      subscriptionRecord.user.email,
    );
  }

  async handleInvoicePaid(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription: string;
    };
    const subscription_id = invoice.subscription;
    const subscription = await this.stripe.subscriptions.retrieve(
      subscription_id,
    );
    await this.subscriptionsService.updateSubscription({
      where: {
        id: subscription_id,
      },
      data: {
        status: subscription.status,
        billingCycleAnchor: subscription.billing_cycle_anchor,
        currentPeriodEnd:
          subscription.current_period_end + this.TWO_DAY_GRACE_PERIOD,
      },
    });
  }

  async handleInvoicePaymentSucceeded(event: Stripe.Event) {
    const data = event.data.object;
    if (data['billing_reason'] == 'subscription_create') {
      this.handleSubscriptionCreate(event);
    }
  }

  async handleSubscriptionCreate(event: Stripe.Event) {
    const invoice_data = event.data.object as Stripe.Invoice & {
      subscription: string;
      payment_intent: string;
      payment_method: string;
    };
    const subscription_id = invoice_data.subscription;
    const payment_intent_id = invoice_data.payment_intent;

    const payment_intent = (await this.stripe.paymentIntents.retrieve(
      payment_intent_id,
      { expand: ['payment_method'] },
    )) as Stripe.PaymentIntent & { payment_method: Stripe.PaymentMethod };

    await this.subscriptionsService.updateSubscription({
      where: {
        id: subscription_id,
      },
      data: {
        status: 'active',
        cardLastFour: +payment_intent.payment_method.card.last4,
        cardExpMonth: +payment_intent.payment_method.card.exp_month,
        cardExpYear: +payment_intent.payment_method.card.exp_year,
      },
    });

    const payment_method = payment_intent.payment_method;
    await this.stripe.subscriptions.update(subscription_id, {
      default_payment_method: payment_method.id,
    });
  }

  async handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription: string;
    };
    const subscriptionRecord =
      await this.subscriptionsService.subscriptionWithUser({
        id: invoice.subscription,
      });
    this.subscriptionsMailService.sendPaymentFailed(
      subscriptionRecord.user.email,
    );
  }

  async handlePaymentMethodAttached(event: Stripe.Event) {
    const payment_method = event.data.object as Stripe.PaymentMethod & {
      customer: string;
    };
    const subscription = await this.subscriptionsService.subscriptionWhere({
      customerId: payment_method.customer,
    });
    const updated_subscription = await this.stripe.subscriptions.update(
      subscription.id,
      {
        default_payment_method: payment_method.id,
      },
    );
    await this.subscriptionsService.updateSubscription({
      where: { id: updated_subscription.id },
      data: {
        cardLastFour: +payment_method.card.last4,
        cardExpMonth: +payment_method.card.exp_month,
        cardExpYear: +payment_method.card.exp_year,
      },
    });
  }

  async handleCustomerSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    await this.subscriptionsService.updateSubscription({
      where: { id: subscription.id },
      data: {
        status: subscription.status,
        billingCycleAnchor: subscription.billing_cycle_anchor,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: subscription.items.data[0].price.id,
        productId: subscription.items.data[0].price.product as string,
        type: this.SUBSCRIPTION_TYPES[subscription.items.data[0].price.id],
      },
    });
  }
}
