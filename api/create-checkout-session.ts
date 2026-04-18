import { getStripe } from './_utils/init';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, credits, amount } = req.body;

    if (!userId || !credits || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Credits for VibeTrailer`,
              description: `Add ${credits} credits to your account.`,
            },
            unit_amount: Math.round(amount * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Ensure these point to the production domain
      success_url: `${process.env.APP_URL || 'https://vibetrailer.fun'}/profile?success=true`,
      cancel_url: `${process.env.APP_URL || 'https://vibetrailer.fun'}/profile?canceled=true`,
      metadata: {
        userId,
        credits: credits.toString(),
      },
    });

    res.status(200).json({ id: session.id });
  } catch (error: any) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: error.message });
  }
}
