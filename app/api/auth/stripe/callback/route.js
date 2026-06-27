import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // NEW: Stripe hands the user's email back to us via the state parameter
    const userEmail = searchParams.get('state'); 

    // If the user clicked "Deny" on the Stripe page
    if (error) {
      return NextResponse.redirect(new URL('/dashboard/edit?error=stripe_denied', request.url));
    }

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    if (!userEmail) {
      // Fixed the redirect typo here: sending them to '/' instead of '/login'
      return NextResponse.redirect(new URL('/?error=session_lost', request.url));
    }

    // Exchange the temporary code for the permanent Stripe Account ID
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeAccountId = response.stripe_user_id; // Looks like 'acct_1QXXXXX'

    // Upsert this into Supabase using the email Stripe handed us
    const { error: dbError } = await supabase
      .from('settings')
      .upsert(
        {
          user_email: userEmail,
          stripe_account_id: stripeAccountId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_account_id' } 
      );

    if (dbError) throw dbError;

    // Send them back to the edit page with a success flag
    return NextResponse.redirect(new URL('/dashboard/edit?success=stripe_connected', request.url));

  } catch (error) {
    console.error('Stripe OAuth Error:', error);
    return NextResponse.redirect(new URL('/dashboard/edit?error=oauth_failed', request.url));
  }
}