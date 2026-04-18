import { db, stripe } from './_utils/init';

// Special logic for capturing raw body in Vercel Node functions
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (userId && credits > 0) {
      try {
        const userRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          const currentCredits = userDoc.exists ? (userDoc.data()?.credits || 0) : 0;
          transaction.set(userRef, { credits: currentCredits + credits }, { merge: true });
        });
        console.log(`Successfully added ${credits} credits to user ${userId}`);
      } catch (error) {
        console.error(`Failed to update credits for user ${userId}:`, error);
      }
    }
  }

  res.json({ received: true });
}
