export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    // 1. Verify the request came from Lemon Squeezy
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const obj = payload.data.attributes;

    // We passed the user_email via custom data in the checkout link
    const userEmail = payload.meta.custom_data?.user_email;

    if (!userEmail) {
      console.log('No user email attached to this checkout. Ignoring.');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Determine the Tier based on the Variant ID or Product Name you set in LS
    let tier = 'basic';
    if (obj.product_name?.toLowerCase().includes('pro')) {
      tier = 'pro';
    }

    // 2. Handle the Lifecycle Events
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: obj.status, // e.g., 'active', 'past_due'
          subscription_tier: tier,
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', userEmail);
    } 
    else if (eventName === 'subscription_expired' || eventName === 'subscription_cancelled') {
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', userEmail);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Lemon Squeezy Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}