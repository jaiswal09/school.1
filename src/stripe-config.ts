export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RZoLqFK9s1sHTh3TxDuJxv3',
    name: 'Test',
    description: 'Test test',
    mode: 'subscription',
  },
];