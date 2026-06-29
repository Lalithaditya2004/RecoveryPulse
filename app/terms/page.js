export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">1. Acceptance of Terms</h2>
        <p className="text-slate-600 mb-4">By accessing and using RecoveryPulse, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.</p>

        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">2. Description of Service</h2>
        <p className="text-slate-600 mb-4">RecoveryPulse provides automated WhatsApp messaging services for Stripe payment recoveries. We act as a data processor connecting your Stripe account to your WhatsApp Business API.</p>

        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3. Account Restrictions</h2>
        <p className="text-slate-600 mb-4">You are responsible for maintaining the security of your account and API keys. We are not liable for any unauthorized access to your connected Stripe or Meta accounts.</p>
      </div>
    </div>
  );
}