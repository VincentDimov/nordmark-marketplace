import Stripe from 'stripe';
import { processStripeEvent } from '@/lib/integrations/payments';
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature)
    return Response.json(
      { error: 'Webhook saknar konfiguration eller signatur.' },
      { status: 400 },
    );
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_webhook_verification_only');
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return Response.json({ error: 'Ogiltig webhooksignatur.' }, { status: 400 });
  }
  if (event.livemode)
    return Response.json({ error: 'Endast testhändelser accepteras.' }, { status: 400 });
  try {
    return Response.json(await processStripeEvent(event));
  } catch {
    return Response.json({ error: 'Händelsen kunde inte behandlas. Återförsök.' }, { status: 500 });
  }
}
