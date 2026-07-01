"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user so we can pass their email to Lemon Squeezy for auto-filling
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
  }, []);

  // Helper to append user data to Lemon Squeezy checkout links
  const getCheckoutLink = (baseLink) => {
    if (!user) return "/signup"; // Redirect to login if they aren't logged in
    
    // Lemon Squeezy allows passing custom data like this:
    // ?checkout[email]=user@email.com&checkout[custom][user_email]=user@email.com
    const encodedEmail = encodeURIComponent(user.email);
    return `${baseLink}?checkout[email]=${encodedEmail}&checkout[custom][user_email]=${encodedEmail}`;
  };

  /* 
    IMPORTANT: Replace these with your actual Lemon Squeezy Variant URLs 
    You get these from the Lemon Squeezy Dashboard -> Products -> Share Button
  */
  const LEMON_SQUEEZY_LINKS = {
    basic_monthly: "https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID_1",
    basic_yearly: "https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID_2",
    pro_monthly: "https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID_3",
    pro_yearly: "https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID_4",
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          
          {/* --- Basic Plan --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col relative">
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

            <Link 
              href={getCheckoutLink(isYearly ? LEMON_SQUEEZY_LINKS.basic_yearly : LEMON_SQUEEZY_LINKS.basic_monthly)}
              className="w-full block text-center py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              {user ? "Subscribe to Basic" : "Sign up to Subscribe"}
            </Link>
          </div>

          {/* --- Pro Plan --- */}
          <div className="bg-indigo-900 rounded-2xl shadow-xl border border-indigo-700 p-8 flex flex-col relative transform md:-translate-y-4">
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

            <Link 
              href={getCheckoutLink(isYearly ? LEMON_SQUEEZY_LINKS.pro_yearly : LEMON_SQUEEZY_LINKS.pro_monthly)}
              className="w-full block text-center py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              {user ? "Subscribe to Pro" : "Sign up to Subscribe"}
            </Link>
          </div>

        </div>
        
        {/* Back to Dashboard Link (Only visible if logged in) */}
        {user && (
          <div className="mt-12 text-center">
            <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              ← Return to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}