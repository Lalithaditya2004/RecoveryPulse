"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TIER_LIMITS = { free: 1, basic: 1, pro: 10, premium: 50 };

export default function EditConfig() {
  const [user, setUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [tierInfo, setTierInfo] = useState({ tier: 'basic', count: 0, limit: 1 });
  
  const [formData, setFormData] = useState({
    businessName: "",
    stripeAccountId: "",
    metaWhatsappToken: "",
    whatsappPhoneNumberId: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "stripe_connected") {
      setStatus({ type: "success", message: "Stripe connected successfully! Now add your WhatsApp keys." });
    } else if (params.get("error")) {
      setStatus({ type: "error", message: "Stripe connection failed or was denied." });
    }
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_email', session.user.email)
        .maybeSingle();

      const userTier = profile?.subscription_tier?.toLowerCase() || 'basic';
      const userLimit = TIER_LIMITS[userTier] || 1;

      const { count: currentCount } = await supabase
        .from('settings')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', session.user.email);

      setTierInfo({ tier: userTier, count: currentCount || 0, limit: userLimit });

      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_email", session.user.email)
        .maybeSingle();

      if (data) {
        setFormData({
          businessName: data.business_name || "",
          stripeAccountId: data.stripe_account_id || "",
          metaWhatsappToken: data.meta_whatsapp_token || "",
          whatsappPhoneNumberId: data.whatsapp_phone_number_id || "",
        });
      }
      setLoadingPage(false);
    };

    fetchConfig();
  }, []);

  const handleStripeConnect = () => {
    if (tierInfo.count >= tierInfo.limit) {
      setStatus({ 
        type: "error", 
        message: `Limit Reached: You can only connect ${tierInfo.limit} business(es) on the ${tierInfo.tier} plan.` 
      });
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID; 
    const redirectUri = `${window.location.origin}/api/auth/stripe/callback`;
    const state = encodeURIComponent(user.email);
    
    window.location.href = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleSaveMetaKeys = async (e) => {
    e.preventDefault();
    
    if (!formData.stripeAccountId) {
      setStatus({ type: "error", message: "You must connect Stripe before saving WhatsApp keys." });
      return;
    }

    setLoadingSubmit(true);
    setStatus({ type: "", message: "" });

    try {
      const { error } = await supabase
        .from('settings')
        .update({
          business_name: formData.businessName, // Saves the custom name
          meta_whatsapp_token: formData.metaWhatsappToken,
          whatsapp_phone_number_id: formData.whatsappPhoneNumberId,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', formData.stripeAccountId);

      if (error) throw error;

      setStatus({ type: "success", message: "Configuration saved!" });
      setTimeout(() => window.location.href = "/dashboard", 1500);

    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingPage) return <div className="p-12 text-center text-slate-500">Loading configuration...</div>;

  return (
    <div className="py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configure Integration</h1>
          </div>
          <button onClick={() => window.location.href = "/dashboard"} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Back
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between bg-slate-100 p-4 rounded-lg border border-slate-200 text-sm">
          <div>
            <span className="font-semibold text-slate-700 capitalize">{tierInfo.tier} Plan</span>
            <span className="text-slate-500 ml-2">({tierInfo.count} / {tierInfo.limit} Businesses)</span>
          </div>
        </div>

        <div className="mb-8 p-6 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">Step 1: Payment Data</h2>
          {formData.stripeAccountId ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg font-medium text-sm">
              ✅ Stripe Connected <span className="font-mono text-xs opacity-75">({formData.stripeAccountId})</span>
            </div>
          ) : (
            <button onClick={handleStripeConnect} className="px-6 py-3 bg-[#635BFF] hover:bg-[#4B45D6] text-white font-semibold rounded-lg shadow-sm transition-colors w-full">
              Connect with Stripe
            </button>
          )}
        </div>

        <form onSubmit={handleSaveMetaKeys} className="space-y-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 text-center">Step 2: Configuration</h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700">Business Display Name</label>
            <input
              type="text"
              placeholder="e.g., Downtown Fitness"
              required
              className="mt-1.5 block w-full p-3 rounded-lg border border-slate-300 text-sm outline-none"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Meta Permanent Token</label>
            <input
              type="password"
              required
              className="mt-1.5 block w-full p-3 rounded-lg border border-slate-300 text-sm outline-none"
              value={formData.metaWhatsappToken}
              onChange={(e) => setFormData({ ...formData, metaWhatsappToken: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Phone Number ID</label>
            <input
              type="text"
              required
              className="mt-1.5 block w-full p-3 rounded-lg border border-slate-300 text-sm outline-none"
              value={formData.whatsappPhoneNumberId}
              onChange={(e) => setFormData({ ...formData, whatsappPhoneNumberId: e.target.value })}
            />
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${status.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
              {status.message}
            </div>
          )}

          <button type="submit" disabled={loadingSubmit || !formData.stripeAccountId} className="w-full py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
            {loadingSubmit ? "Saving..." : "Save Configuration"}
          </button>
        </form>

      </div>
    </div>
  );
}