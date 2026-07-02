
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
});

// Initialize Admin client to safely write to the database
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // We passed the user's email in the state
  const error = searchParams.get('error');

  // If the user clicked "Cancel" on the Stripe page
  if (error) {
    return NextResponse.redirect(new URL('/dashboard?error=stripe_denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?error=missing_params', request.url));
  }

  const userEmail = decodeURIComponent(state);

  try {
    // 1. Exchange the code for the Connected Account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    
    const stripeAccountId = response.stripe_user_id;

    // 2. Fetch the actual business name directly from Stripe
    const accountDetails = await stripe.accounts.retrieve(stripeAccountId);
    const businessName = accountDetails.business_profile?.name || 'Unnamed Business';

    // 3. Save directly to Supabase
    const { error: dbError } = await supabaseAdmin
      .from('settings')
      .insert({
        user_email: userEmail,
        stripe_account_id: stripeAccountId,
        business_name: businessName
      });

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      throw new Error("Failed to save to database");
    }

    // 4. Send them back to the dashboard. It will instantly show the new business!
    return NextResponse.redirect(new URL('/dashboard?success=true', request.url));

  } catch (err) {
    console.error("Stripe Callback Error:", err);
    return NextResponse.redirect(new URL('/dashboard?error=setup_failed', request.url));
  }
}