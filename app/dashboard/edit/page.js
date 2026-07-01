"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TIER_LIMITS = { basic: 7, pro: 20 };

export default function EditConfig() {
  const [user, setUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [tierInfo, setTierInfo] = useState({ tier: 'basic', count: 0, limit: 1 });
  
  const [formData, setFormData] = useState({
    businessName: "",
    stripeAccountId: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "stripe_connected") {
      setStatus({ type: "success", message: "Stripe connected successfully!" });
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

  const handleSaveName = async (e) => {
    e.preventDefault();
    
    if (!formData.stripeAccountId) {
      setStatus({ type: "error", message: "You must connect Stripe before saving." });
      return;
    }

    setLoadingSubmit(true);
    setStatus({ type: "", message: "" });

    try {
      const { error } = await supabase
        .from('settings')
        .update({
          business_name: formData.businessName,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', formData.stripeAccountId);

      if (error) throw error;

      setStatus({ type: "success", message: "Business saved!" });
      setTimeout(() => window.location.href = "/dashboard", 1500);

    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingPage) return <div className="p-12 text-center text-slate-500">Loading...</div>;

  return (
    <div className="py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add Business</h1>
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

        {/* The unified form */}
        <form onSubmit={handleSaveName} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Internal Business Name</label>
            <input
              type="text"
              placeholder="e.g., Downtown Fitness"
              required
              className="mt-1.5 block w-full p-3 rounded-lg border border-slate-300 text-sm outline-none"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          {!formData.stripeAccountId ? (
            <button type="button" onClick={handleStripeConnect} className="px-6 py-3 bg-[#635BFF] hover:bg-[#4B45D6] text-white font-semibold rounded-lg shadow-sm transition-colors w-full">
              Connect with Stripe
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-100 px-4 py-3 rounded-lg font-medium text-sm border border-emerald-200">
                ✅ Stripe Connected <span className="font-mono text-xs opacity-75">({formData.stripeAccountId})</span>
              </div>
              <button type="submit" disabled={loadingSubmit} className="w-full py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
                {loadingSubmit ? "Saving..." : "Save Business"}
              </button>
            </div>
          )}

          {status.message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${status.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
              {status.message}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}