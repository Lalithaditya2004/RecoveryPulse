import { NextResponse } from 'next/server'
import { getCustomerPhone } from '@/lib/stripe'
import { sendRecoveryMessage } from '@/lib/whatsapp'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe to fetch the connected account's business name
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', 
});

// Initialize Supabase Admin client for secure backend operations (bypasses RLS safely)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function POST(request) {
  // Elevate these variables so the catch block can log them even if the process fails midway
  let stripeEventId = null;
  let founderEmail = null;
  let customerEmail = null;
  let rawAmount = null;
  let companyName = null;

  try {
    const body = await request.text(); // Get raw body as text
    const sig = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Now safely parse the JSON
    const parsedBody = JSON.parse(body);

    // 1. Identify the Connected Account via Stripe Connect payload
    const connectedAccountId = parsedBody.account
    console.log(`Received Stripe webhook for connected account: ${connectedAccountId}`)
    
    if (!connectedAccountId) {
      console.log("No connected account ID found. Ignored platform-level event.")
      return NextResponse.json(
        { received: true, note: 'Ignored platform-level event' },
        { status: 200 }
      )
    }

    stripeEventId = body.id
    const eventType = body.type

    if (eventType !== 'invoice.payment_failed') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 2. Prevent Duplicates (Using supabaseAdmin)
    const { data: duplicate } = await supabaseAdmin
      .from('payment_events')
      .select('id')
      .eq('stripe_event_id', stripeEventId)
      .maybeSingle()

    if (duplicate) {
      return NextResponse.json({ duplicate: true }, { status: 200 })
    }

    // 3. Extract Dynamic Payload Data (Populate elevated variables)
    customerEmail = body.data.object.customer_email
    const customerName = body.data.object.customer_name || 'there'
    
    const recoveryLink = body.data.object.hosted_invoice_url; 
    
    rawAmount = body.data.object.amount_due / 100
    const currency = body.data.object.currency?.toUpperCase() || ''
    const formattedAmount = `${rawAmount.toFixed(2)} ${currency}`.trim()

    const stripeCustomerId = body.data.object.customer

    // 4. Look up Client Settings using the Stripe Account ID
    const { data: founderSettings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('stripe_account_id', connectedAccountId)
      .maybeSingle() // Changed from single() to avoid throwing errors on empty results

    if (settingsError) {
      throw new Error(`Database error fetching config: ${settingsError.message}`)
    }

    // GRACEFUL EXIT: If the setting was deleted by the user, stop here.
    if (!founderSettings) {
      console.log(`Config missing for ${connectedAccountId}. Business was likely removed. Ignoring.`);
      return NextResponse.json(
        { received: true, note: 'Business disconnected, webhook ignored' }, 
        { status: 200 } // Return 200 so Stripe doesn't retry
      );
    }

    founderEmail = founderSettings.user_email;

    // 5. Check Subscription Status
    const { data: founderProfile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status')
      .eq('user_email', founderEmail)
      .single();

    if (!founderProfile || founderProfile.subscription_status !== 'active') {
      console.log(`User ${founderEmail} is not active. Ignoring payment failure.`);
      return NextResponse.json(
        { received: true, note: 'Subscription inactive, webhook ignored' }, 
        { status: 200 }
      );
    }

    // Fetch the actual Business Name
    const connectedAccountDetails = await stripe.accounts.retrieve(connectedAccountId);
    companyName = connectedAccountDetails.business_profile?.name || 'our company';

    // 6. Get Phone Number using Stripe Connect Authorization
    let customerPhone = await getCustomerPhone({
      stripeAccountId: connectedAccountId,
      customerId: stripeCustomerId
    })

    // Graceful Failure: If no phone is found, log as failed and do not retry
    if (!customerPhone) {
      console.log(`No phone number found for ${customerEmail}. Marking event as failed.`);
      
      await supabaseAdmin
        .from('payment_events')
        .insert({
          stripe_event_id: stripeEventId,
          founder_email: founderEmail,
          customer_email: customerEmail,
          amount_due: rawAmount,
          business_name: companyName,
          status: 'failed' 
        });

      // Return 200 so Stripe knows we handled it and doesn't retry
      return NextResponse.json({ success: true, note: 'No phone number, logged as failed' }, { status: 200 });
    }

    console.log(`Preparing to send WhatsApp to ${customerPhone} for ${customerEmail}`) 

    // 7. Fire the centralized WhatsApp message
    await sendRecoveryMessage({
      customerPhone,
      customerName,
      companyName,      
      amount: formattedAmount,
      recoveryLink,
    });
    
    console.log(`WhatsApp message sent successfully to ${customerPhone}`)
    
    // 8. Log Success Event
    const { error: insertError } = await supabaseAdmin
      .from('payment_events')
      .insert({
        stripe_event_id: stripeEventId,
        founder_email: founderEmail,
        customer_email: customerEmail,
        amount_due: rawAmount,
        business_name: companyName,
        status: 'whatsapp_sent'
      })

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch(error) {
    console.error("Webhook processing error:", error)

    // Graceful Failure: Log whatever context we managed to collect before the crash
    if (stripeEventId) {
      const { error: upsertError } = await supabaseAdmin
        .from('payment_events')
        .upsert({
          stripe_event_id: stripeEventId,
          founder_email: founderEmail || null,
          customer_email: customerEmail || 'Unknown',
          amount_due: rawAmount || 0,
          business_name: companyName || 'Unknown',
          status: 'failed'
        }, { onConflict: 'stripe_event_id' })
        
      if (upsertError) {
        console.error("CRITICAL: Could not even log the failure to Supabase:", upsertError);
      }
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}