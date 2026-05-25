import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userEmail,

      stripeWebhookSecret,

      stripeSecretKey,

      metaWhatsappToken,

      whatsappPhoneNumberId,
    } = body;

    if (!userEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Upsert means: if email exists, update it. If not, insert a new record.
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          user_email: userEmail,
          stripe_webhook_secret: stripeWebhookSecret,
          stripe_secret_key: stripeSecretKey,
          meta_whatsapp_token: metaWhatsappToken,
          whatsapp_phone_number_id: whatsappPhoneNumberId,
        },
        { onConflict: "user_email" },
      )
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: "Settings saved successfully!", data },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
