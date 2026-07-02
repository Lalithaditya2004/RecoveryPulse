"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('none');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user and their real-time subscription profile status
    const fetchUserAndPlan = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_status')
          .eq('user_email', session.user.email)
          .maybeSingle();
          
        if (profile) {
          setCurrentPlan(profile.subscription_tier?.toLowerCase() || 'none');
          setIsActive(profile.subscription_status === 'active');
        }
      }
      setLoading(false);
    };
    fetchUserAndPlan();
  }, []);

  // Helper to append user data to Lemon Squeezy checkout links
  const getCheckoutLink = (baseLink) => {
    if (!user) return "/"; // Redirect to login if they aren't logged in
    
    const encodedEmail = encodeURIComponent(user.email);
    return `${baseLink}?checkout[email]=${encodedEmail}&checkout[custom][user_email]=${encodedEmail}`;
  };

  const LEMON_SQUEEZY_LINKS = {
    basic_monthly: "https://recovery-pulse.lemonsqueezy.com/checkout/buy/9d798fc7-c94a-4367-b7e1-e4cac2b3c90e",
    basic_yearly: "https://recovery-pulse.lemonsqueezy.com/checkout/buy/5e154780-47ef-4bf1-94d9-0e2a4f4104ef",
    pro_monthly: "https://recovery-pulse.lemonsqueezy.com/checkout/buy/866374dc-3290-42ed-9224-39d8ed114ab3",
    pro_yearly: "https://recovery-pulse.lemonsqueezy.com/checkout/buy/9ba4d6f9-58bc-40ae-b25d-4d3802d4a500",
  };

  // Replace this placeholder link with your actual Lemon Squeezy Customer Portal URL
  const LEMON_SQUEEZY_BILLING_PORTAL = "https://recovery-pulse.lemonsqueezy.com/billing";

  if (loading) return <div className="p-12 text-center text-slate-500">Loading pricing plans...</div>;

  return (
    <div className="py-24 px-4 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Recover lost revenue automatically. Choose the plan that fits your scale.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-10 inline-flex bg-slate-200 rounded-lg p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 text-sm font-semibold rounded-md transition-all ${
                !isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${
                isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yearly <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">2 Months Free</span>
            </button>
          </div>
        </div>

        {/* Active Plan Banner Overlay */}
        {isActive && (
          <div className="mb-12 max-w-3xl mx-auto bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-lg font-bold text-indigo-900 mb-1">You have an active {currentPlan} subscription.</h3>
            <p className="text-sm text-indigo-700 mb-4">To safely upgrade, downgrade, or update payment information without duplicate billing, please open your secure customer portal below.</p>
            <a href={LEMON_SQUEEZY_BILLING_PORTAL} target="_blank" rel="noreferrer" className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm">
              Manage Subscription & Billing
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          
          {/* --- Basic Plan --- */}
          <div className={`bg-white rounded-2xl shadow-sm border p-8 flex flex-col relative ${currentPlan === 'basic' && isActive ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Basic</h2>
              <p className="text-sm text-slate-500 mt-2">Perfect for growing portfolios.</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">
                ${isYearly ? "190" : "19"}
              </span>
              <span className="text-slate-500 font-medium">/{isYearly ? "year" : "month"}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                Connect up to <strong>7 Businesses</strong>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                Automated WhatsApp Recovery
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                30-Day Recovery History
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                Zero transaction fees
              </li>
            </ul>

            {currentPlan === 'basic' && isActive ? (
              <button disabled className="w-full text-center py-3 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-lg cursor-not-allowed">
                Current Plan
              </button>
            ) : isActive ? (
              <a 
                href={LEMON_SQUEEZY_BILLING_PORTAL}
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors"
              >
                Manage in Portal
              </a>
            ) : (
              <Link 
                href={getCheckoutLink(isYearly ? LEMON_SQUEEZY_LINKS.basic_yearly : LEMON_SQUEEZY_LINKS.basic_monthly)}
                className="w-full block text-center py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                {user ? "Subscribe to Basic" : "Sign up to Subscribe"}
              </Link>
            )}
          </div>

          {/* --- Pro Plan --- */}
          <div className={`bg-indigo-900 rounded-2xl shadow-xl border p-8 flex flex-col relative transform md:-translate-y-4 ${currentPlan === 'pro' && isActive ? 'border-white ring-4 ring-indigo-500/30' : 'border-indigo-700'}`}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Pro</h2>
              <p className="text-indigo-200 text-sm mt-2">For agencies and heavy volume.</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">
                ${isYearly ? "490" : "49"}
              </span>
              <span className="text-indigo-200 font-medium">/{isYearly ? "year" : "month"}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm text-indigo-100">
                <span className="text-emerald-400">✓</span>
                Connect up to <strong>20 Businesses</strong>
              </li>
              <li className="flex items-start gap-3 text-sm text-indigo-100">
                <span className="text-emerald-400">✓</span>
                Automated WhatsApp Recovery
              </li>
              <li className="flex items-start gap-3 text-sm text-indigo-100">
                <span className="text-emerald-400">✓</span>
                30-Day Recovery History
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-semibold">
                <span className="text-emerald-400">✓</span>
                One-Click CSV Data Export
              </li>
            </ul>

            {currentPlan === 'pro' && isActive ? (
              <button disabled className="w-full text-center py-3 px-4 bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold rounded-lg cursor-not-allowed">
                Current Plan
              </button>
            ) : isActive ? (
              <a 
                href={LEMON_SQUEEZY_BILLING_PORTAL}
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-3 px-4 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 font-semibold rounded-lg transition-colors"
              >
                Manage in Portal
              </a>
            ) : (
              <Link 
                href={getCheckoutLink(isYearly ? LEMON_SQUEEZY_LINKS.pro_yearly : LEMON_SQUEEZY_LINKS.pro_monthly)}
                className="w-full block text-center py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                {user ? "Subscribe to Pro" : "Sign up to Subscribe"}
              </Link>
            )}
          </div>

        </div>
        
        {/* Strict No-Refund Policy Disclaimer */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl mx-auto">
            <strong>Refund & Billing Policy:</strong> Upgrades and downgrades are processed immediately via your secure billing portal. By executing an allocation modification, you acknowledge that we maintain a strict no-refund policy for current, partial, or multi-month periods. Active billing cycles will automatically adapt to adjustments seamlessly; separate public acquisitions are locked out to protect against double-charging profiles.
          </p>
        </div>

        {/* Back to Dashboard Link */}
        {user && (
          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              ← Return to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}