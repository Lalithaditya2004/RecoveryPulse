export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">1. Information We Collect</h2>
        <p className="text-slate-600 mb-4">We collect your email address for account creation. For the service to function, we securely store your Stripe Account IDs and Meta WhatsApp API tokens.</p>

        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">2. How We Use Your Data</h2>
        <p className="text-slate-600 mb-4">Your data is used strictly to facilitate automated messages to your customers when a payment fails. We do not sell, rent, or share your API keys or customer data with third parties.</p>

        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3. Data Retention</h2>
        <p className="text-slate-600 mb-4">Webhook event data (such as failed payment amounts and customer emails) are stored securely for logging purposes and can be deleted upon request.</p>
      </div>
    </div>
  );
}