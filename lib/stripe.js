import Stripe from 'stripe'

export async function getCustomerPhone({
  stripeAccountId,
  customerId
}) {
  // 1. Initialize with YOUR Platform's Secret Key
  const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' 
  })

  // 2. Pass the client's account ID in the request options header
  const customer = await stripe.customers.retrieve(customerId, undefined, {
    stripeAccount: stripeAccountId,
  })

  // Fallback check: Look at the native phone field first, then check metadata
  const rawPhone = customer.phone || customer.metadata?.customer_phone

  if (!rawPhone) {
    return null
  }

  // Meta API Requirement: Strip out all non-numeric characters (like +, -, spaces)
  const cleanPhone = rawPhone.replace(/\D/g, '')

  return cleanPhone
}