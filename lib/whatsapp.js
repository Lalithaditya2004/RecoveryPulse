export async function sendRecoveryMessage({
  customerPhone,
  customerName,
  amount,
  companyName,
  recoveryLink,
}) {
  const token = process.env.MASTER_META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.MASTER_WHATSAPP_PHONE_ID;
  const templateName = process.env.MASTER_WHATSAPP_TEMPLATE_NAME;

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(customerName) },
                { type: "text", text: String(companyName) },
                { type: "text", text: String(amount) },
                { type: "text", text: String(recoveryLink) }
              ]
            }
          ]
        }
      })
    }
  )
  
  const result = await response.json()
  
  if(!response.ok){
    console.error("WhatsApp API Error:", result);
    throw new Error(result.error?.message || 'Whatsapp send failed');
  }

  return result
}