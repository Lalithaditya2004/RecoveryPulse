import { NextResponse } from 'next/server'
import { getCustomerPhone } from '@/lib/stripe'
import { sendRecoveryMessage } from '@/lib/whatsapp'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe to fetch the connected account's business name
const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
})

// Initialize Supabase Admin client for secure backend operations (bypasses RLS safely)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function logWebhook(stage, details) {
  console.log(`[StripeWebhook] ${stage}`, details)
}

export async function POST(request) {
  let stripeEventId = null
  let founderEmail = null
  let customerEmail = null
  let rawAmount = null
  let companyName = null
  let connectedAccountId = null
  let eventType = null

  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    const webhookSecret = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET

    logWebhook('request-started', {
      hasSignature: Boolean(sig),
      hasWebhookSecret: Boolean(webhookSecret),
      bodyLength: body?.length || 0,
      contentType: request.headers.get('content-type'),
    })

    if (!body) {
      throw new Error('Empty request body received')
    }

    let event
    let parsedBody

    try {
      parsedBody = JSON.parse(body)
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      logWebhook('signature-or-parse-failed', {
        error: err.message,
        stack: err.stack,
      })
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
    }

    stripeEventId = parsedBody.id || event?.id || null
    eventType = parsedBody.type || event?.type || null
    connectedAccountId = parsedBody.account || null

    logWebhook('event-received', {
      stripeEventId,
      eventType,
      connectedAccountId,
      hasObject: Boolean(parsedBody.data?.object),
    })

    if (!connectedAccountId) {
      logWebhook('ignoring-platform-event', { stripeEventId, eventType })
      return NextResponse.json(
        { received: true, note: 'Ignored platform-level event' },
        { status: 200 }
      )
    }

    if (eventType !== 'invoice.payment_failed') {
      logWebhook('ignoring-unhandled-event', {
        stripeEventId,
        eventType,
        connectedAccountId,
      })
      return NextResponse.json({ received: true, note: `Ignored event type: ${eventType}` }, { status: 200 })
    }

    const paymentObject = parsedBody.data?.object || {}
    customerEmail = paymentObject.customer_email || null
    
    // AUTOMATIC FALLBACK: Will use 'there' if name is null
    const customerName = paymentObject.customer_name || 'there'
    
    const recoveryLink = paymentObject.hosted_invoice_url || null

    rawAmount = paymentObject.amount_due ? paymentObject.amount_due / 100 : null
    const currency = paymentObject.currency?.toUpperCase() || ''
    const formattedAmount = rawAmount !== null ? `${rawAmount.toFixed(2)} ${currency}`.trim() : ''
    const stripeCustomerId = paymentObject.customer

    logWebhook('payment-payload', {
      stripeEventId,
      connectedAccountId,
      customerEmail,
      customerName,
      stripeCustomerId,
      formattedAmount,
      recoveryLink: recoveryLink ? 'present' : 'missing',
      eventType,
    })

    const { data: duplicate, error: duplicateError } = await supabaseAdmin
      .from('payment_events')
      .select('id')
      .eq('stripe_event_id', stripeEventId)
      .maybeSingle()

    if (duplicateError) {
      throw new Error(`Duplicate check failed: ${duplicateError.message}`)
    }

    logWebhook('duplicate-check', { stripeEventId, duplicateFound: Boolean(duplicate) })

    if (duplicate) {
      logWebhook('duplicate-event-ignored', { stripeEventId })
      return NextResponse.json({ duplicate: true }, { status: 200 })
    }

    const { data: founderSettings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('stripe_account_id', connectedAccountId)
      .maybeSingle()

    if (settingsError) {
      throw new Error(`Database error fetching config: ${settingsError.message}`)
    }

    logWebhook('settings-lookup', {
      connectedAccountId,
      settingsFound: Boolean(founderSettings),
      founderEmail: founderSettings?.user_email || null,
    })

    if (!founderSettings) {
      logWebhook('config-missing', { connectedAccountId })
      return NextResponse.json(
        { received: true, note: 'Business disconnected, webhook ignored' },
        { status: 200 }
      )
    }

    founderEmail = founderSettings.user_email

    const { data: founderProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status')
      .eq('user_email', founderEmail)
      .single()

    if (profileError) {
      throw new Error(`Profile lookup failed: ${profileError.message}`)
    }

    logWebhook('profile-status', {
      founderEmail,
      subscriptionStatus: founderProfile?.subscription_status || null,
    })

    if (!founderProfile || founderProfile.subscription_status !== 'active') {
      logWebhook('subscription-inactive', {
        founderEmail,
        subscriptionStatus: founderProfile?.subscription_status || null,
      })
      return NextResponse.json(
        { received: true, note: 'Subscription inactive, webhook ignored' },
        { status: 200 }
      )
    }

    const connectedAccountDetails = await stripe.accounts.retrieve(connectedAccountId)
    companyName = connectedAccountDetails.business_profile?.name || 'our company'

    logWebhook('stripe-account-details', { connectedAccountId, companyName })

    let customerPhone = await getCustomerPhone({
      stripeAccountId: connectedAccountId,
      customerId: stripeCustomerId,
    })

    logWebhook('customer-phone-lookup', {
      connectedAccountId,
      stripeCustomerId,
      customerPhone: customerPhone ? 'found' : 'missing',
    })

    // FAILURE 1: NO PHONE NUMBER FOUND
    if (!customerPhone) {
      logWebhook('no-phone-found', { stripeEventId, customerEmail })

      await supabaseAdmin.from('payment_events').insert({
        stripe_event_id: stripeEventId,
        founder_email: founderEmail,
        customer_email: customerEmail,
        amount_due: rawAmount,
        business_name: companyName,
        status: 'failed',
        failure_reason: 'No phone number found in Stripe'
      })

      return NextResponse.json({ success: true, note: 'No phone number, logged as failed' }, { status: 200 })
    }

    logWebhook('sending-whatsapp', {
      stripeEventId,
      customerPhone,
      customerEmail,
      companyName,
      amount: formattedAmount,
    })

    // Attempt to send WhatsApp
    try {
      await sendRecoveryMessage({
        customerPhone,
        customerName,
        companyName,
        amount: formattedAmount,
        recoveryLink,
      })
    } catch (waError) {
      // FAILURE 2: WHATSAPP REJECTED (e.g., number not registered on WhatsApp)
      logWebhook('whatsapp-failed', { error: waError.message })
      await supabaseAdmin.from('payment_events').insert({
        stripe_event_id: stripeEventId,
        founder_email: founderEmail,
        customer_email: customerEmail,
        amount_due: rawAmount,
        business_name: companyName,
        status: 'failed',
        failure_reason: `WhatsApp Error: ${waError.message}`
      })
      return NextResponse.json({ success: true, note: 'Logged as failed (WhatsApp rejected)' }, { status: 200 })
    }

    logWebhook('whatsapp-sent', { stripeEventId, customerPhone })

    // SUCCESS
    const { error: insertError } = await supabaseAdmin.from('payment_events').insert({
      stripe_event_id: stripeEventId,
      founder_email: founderEmail,
      customer_email: customerEmail,
      amount_due: rawAmount,
      business_name: companyName,
      status: 'whatsapp_sent',
      failure_reason: null
    })

    if (insertError) {
      console.error('Supabase Insert Error:', insertError)
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logWebhook('webhook-failed', {
      message: error.message,
      stack: error.stack,
      stripeEventId,
      founderEmail,
      customerEmail,
      rawAmount,
      companyName,
    })

    // FAILURE 3: CRITICAL INTERNAL ERROR
    if (stripeEventId) {
      const { error: upsertError } = await supabaseAdmin
        .from('payment_events')
        .upsert(
          {
            stripe_event_id: stripeEventId,
            founder_email: founderEmail || null,
            customer_email: customerEmail || 'Unknown',
            amount_due: rawAmount || 0,
            business_name: companyName || 'Unknown',
            status: 'failed',
            failure_reason: `Internal Error: ${error.message}`
          },
          { onConflict: 'stripe_event_id' }
        )

      if (upsertError) {
        console.error('CRITICAL: Could not even log the failure to Supabase:', upsertError)
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}