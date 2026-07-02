export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userEmail,
      stripeWebhookSecret,
      stripeSecretKey,
      metaWhatsappToken,
      whatsappPhoneNumberId
    } = body;

    // Validate that the email exists to prevent blank records
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Upsert into Supabase (Insert if new, Update if exists based on email)
    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          user_email: userEmail,
          stripe_webhook_secret: stripeWebhookSecret,
          stripe_secret_key: stripeSecretKey,
          meta_whatsapp_token: metaWhatsappToken,
          whatsapp_phone_number_id: whatsappPhoneNumberId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' } // Ensures email remains unique per user
      );

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}