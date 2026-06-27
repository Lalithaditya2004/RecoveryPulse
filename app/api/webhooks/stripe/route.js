import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCustomerPhone } from '@/lib/stripe'
import { sendRecoveryMessage } from '@/lib/whatsapp'

export async function POST(request) {
  // Declare these at the top scope so the catch block can use them to log failures
  let stripeEventId = null;
  let founderEmail = null;

  try {
    const body = await request.json()

    // 1. Identify the Connected Account via Stripe Connect payload
    const connectedAccountId = body.account
    console.log(`Received Stripe webhook for connected account: ${connectedAccountId}`)
    if (!connectedAccountId) {
      console.log("No connected account ID found in the webhook payload. This event is from the platform account.")
      // If there is no account ID, this event happened on your master platform account.
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

    // 2. Prevent Duplicates
    const { data: duplicate } = await supabase
      .from('payment_events')
      .select('id')
      .eq('stripe_event_id', stripeEventId)
      .maybeSingle()

    if (duplicate) {
      return NextResponse.json({ duplicate: true }, { status: 200 })
    }

    // 3. Extract Dynamic Payload Data
    const customerEmail = body.data.object.customer_email
    const customerName = body.data.object.customer_name || 'there'
    
    // Format amount into a clean currency string (e.g., "100.00 USD")
    const rawAmount = body.data.object.amount_due / 100
    const currency = body.data.object.currency?.toUpperCase() || ''
    const formattedAmount = `${rawAmount.toFixed(2)} ${currency}`.trim()

    const stripeCustomerId = body.data.object.customer

    // 4. Look up Client Settings using the Stripe Account ID
    const { data: founderSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('stripe_account_id', connectedAccountId)
      .single()

    if (settingsError || !founderSettings) {
      throw new Error(`Config missing for Stripe account: ${connectedAccountId}`)
    }

    founderEmail = founderSettings.user_email;

    // 5. Get Phone Number using Stripe Connect Authorization
    let customerPhone = await getCustomerPhone({
      stripeAccountId: connectedAccountId,
      customerId: stripeCustomerId
    })

    // TEMPORARY FALLBACK
    if (!customerPhone) {
      console.log("No phone found in Stripe, using fallback for testing...");
      customerPhone = "918639610590"; 
    }

    const recoveryLink = `https://recoverypulse.app/update-payment?customer=${customerEmail}`
    console.log(`Preparing to send WhatsApp message to ${customerPhone} for ${customerEmail} regarding ${formattedAmount}`) 

    // 6. Fire the dynamic WhatsApp message
    await sendRecoveryMessage({
      token: founderSettings.meta_whatsapp_token,
      phoneNumberId: founderSettings.whatsapp_phone_number_id,
      customerPhone,
      customerName,
      amount: formattedAmount,
      recoveryLink
    })

    // 7. Log Success Event
    await supabase
      .from('payment_events')
      .insert({
        stripe_event_id: stripeEventId,
        founder_email: founderEmail,
        customer_email: customerEmail,
        amount_due: rawAmount,
        status: 'whatsapp_sent'
      })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch(error) {
    console.error("Webhook processing error:", error)

    // Safely log the failure only if we managed to extract the Stripe Event ID
    if (stripeEventId) {
      await supabase
        .from('payment_events')
        .upsert({
          stripe_event_id: stripeEventId,
          founder_email: founderEmail, // Will be null if it crashed before fetching settings
          status: 'failed'
        }, { onConflict: 'stripe_event_id' })
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}