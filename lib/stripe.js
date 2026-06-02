import Stripe from 'stripe'

export async function getCustomerPhone({
  stripeSecretKey,
  customerId
}) {

  // Added apiVersion to silence SDK warnings. 
  // You can update the date to the current Stripe API version you are targeting.
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' 
  })

  const customer = await stripe.customers.retrieve(customerId)

  // Fallback check: Look at the native phone field first, then check metadata
  const rawPhone = customer.phone || customer.metadata?.customer_phone

  if (!rawPhone) {
    return null
  }

  // Meta API Requirement: Strip out all non-numeric characters (like +, -, spaces)
  const cleanPhone = rawPhone.replace(/\D/g, '')

  return cleanPhone
}