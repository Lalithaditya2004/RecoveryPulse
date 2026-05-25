export async function sendRecoveryMessage({
  token,
  phoneNumberId,
  customerPhone,
  amount,
  recoveryLink
}) {

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method:'POST',

      headers:{
        Authorization:`Bearer ${token}`,
        'Content-Type':'application/json'
      },

      body:JSON.stringify({
        messaging_product:'whatsapp',

        to:customerPhone,

        type:'template',

        template:{
          name:'payment_recovery',

          language:{
            code:'en'
          },

          components:[
            {
              type:'body',

              parameters:[
                {
                  type:'text',
                  text:String(amount)
                },

                {
                  type:'text',
                  text:recoveryLink
                }
              ]
            }
          ]
        }
      })
    }
  )

  const result = await response.json()

  if(!response.ok){
    throw new Error(
      result.error?.message ||
      'Whatsapp send failed'
    )
  }

  return result
}