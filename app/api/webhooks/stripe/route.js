import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

import { sendRecoveryMessage }
from '@/lib/whatsapp'

export async function POST(request){

try{

const { searchParams } =
new URL(request.url)

const founderEmail =
searchParams.get('email')

if(!founderEmail){

return NextResponse.json(
{error:'Founder missing'},
{status:400}
)

}

const body =
await request.json()

const stripeEventId =
body.id

const eventType =
body.type

if(
eventType !==
'invoice.payment_failed'
){

return NextResponse.json(
{received:true},
{status:200}
)

}

const duplicate =
await supabase
.from('payment_events')
.select('*')
.eq(
'stripe_event_id',
stripeEventId
)
.maybeSingle()

if(duplicate.data){

return NextResponse.json(
{duplicate:true},
{status:200}
)

}

const customerEmail =
body
.data
.object
.customer_email

const amountDue =
body
.data
.object
.amount_due/100

const founderSettings =
await supabase
.from('settings')
.select('*')
.eq(
'user_email',
founderEmail
)
.single()

if(
!founderSettings.data
){

throw new Error(
'Founder config missing'
)

}

const customer =
await supabase
.from('customers')
.select('*')
.eq(
'founder_email',
founderEmail
)
.eq(
'customer_email',
customerEmail
)
.single()

if(
!customer.data
){

throw new Error(
'Customer phone missing'
)

}

const recoveryLink =
`https://recoverypulse.app/update-payment?customer=${customerEmail}`

await sendRecoveryMessage({

token:
founderSettings
.data
.meta_whatsapp_token,

phoneNumberId:
founderSettings
.data
.whatsapp_phone_number_id,

customerPhone:
customer
.data
.customer_phone,

amount:
amountDue,

recoveryLink

})

await supabase
.from('payment_events')
.insert({

stripe_event_id:
stripeEventId,

founder_email:
founderEmail,

customer_email:
customerEmail,

amount_due:
amountDue,

status:
'whatsapp_sent'

})

return NextResponse.json(
{success:true},
{status:200}
)

}

catch(error){

console.log(error)

await supabase
.from('payment_events')
.insert({

status:'failed',

error_message:
error.message

})

return NextResponse.json(
{
error:error.message
},
{
status:500
}
)

}

}