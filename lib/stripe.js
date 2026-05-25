import Stripe from 'stripe'

export async function getCustomerPhone({

stripeSecretKey,

customerId

}){

const stripe =
new Stripe(
stripeSecretKey
)

const customer =
await stripe.customers.retrieve(
customerId
)

return customer.metadata
?.customer_phone

}