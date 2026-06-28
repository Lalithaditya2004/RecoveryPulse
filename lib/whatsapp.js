export async function sendRecoveryMessage({
  token,
  phoneNumberId,
  customerPhone,
  customerName,
  amount,
  companyName,
  recoveryLink
}) {

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
          name: "recovery_template",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(customerName) },
                { type: "text", text: String(amount) },
                { type: "text", text: String(companyName) },
                { type: "text", text: String(recoveryLink) }
              ]
            }
          ]
        }
      })
    }
  )
  
  const result = await response.json()
  console.log(result)
  
  if(!response.ok){
    throw new Error(
      result.error?.message ||
      'Whatsapp send failed'
    )
  }

  return result
}