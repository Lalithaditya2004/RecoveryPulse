export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 prose prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Refund Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Subscription Refunds</h2>
        <p className="text-slate-600 mb-4">We offer a 14-day money-back guarantee for all new subscriptions. If you are not satisfied with RecoveryPulse within your first 14 days of billing, contact support for a full refund.</p>

        <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Cancellations</h2>
        <p className="text-slate-600 mb-4">You can cancel your subscription at any time. Upon cancellation, you will retain access to the platform until the end of your current billing cycle. We do not offer prorated refunds for mid-cycle cancellations.</p>
      </div>
    </div>
  );
}