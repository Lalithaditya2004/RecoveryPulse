"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierInfo, setTierInfo] = useState({ tier: 'basic', limit: 1 });

  const TIER_LIMITS = { free: 1, basic: 1, pro: 10, premium: 50 };

  useEffect(() => {
    const fetchDashboardData = async () => {
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

      const currentTier = profile?.subscription_tier?.toLowerCase() || 'basic';
      setTierInfo({ tier: currentTier, limit: TIER_LIMITS[currentTier] });

      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_email", session.user.email);

      if (settingsData) setConfigs(settingsData);
      
      const { data: eventData } = await supabase
        .from("payment_events")
        .select("*")
        .eq("founder_email", session.user.email)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (eventData) setEvents(eventData);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Businesses</h1>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700 capitalize mb-2">
                {tierInfo.tier} Plan ({configs.length}/{tierInfo.limit})
              </div>
              {configs.length < tierInfo.limit ? (
                <Link href="/dashboard/edit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                  + Add Business
                </Link>
              ) : (
                <Link href="/pricing" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                  Upgrade to Add More
                </Link>
              )}
            </div>
          </div>

          {configs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
              <p className="text-slate-500 mb-6">Connect your first Stripe account to get started.</p>
              <Link href="/dashboard/edit" className="px-6 py-3 bg-[#635BFF] text-white font-semibold rounded-lg shadow-sm">
                Connect with Stripe
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map((config) => (
                <div key={config.stripe_account_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    {/* Shows Business Name, falls back to Stripe ID if none exists */}
                    <span className="text-lg font-semibold text-slate-800">
                      {config.business_name || "Unnamed Business"}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6 flex-grow">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Stripe ID</p>
                      <p className="text-sm font-mono text-slate-600">{config.stripe_account_id}</p>
                    </div>
                  </div>

                  <Link href="/dashboard/edit" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center">
                    Edit Configuration <span className="ml-1">→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recovery History</h2>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No recovery events recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Business</th>
                      <th className="px-6 py-4">Customer Email</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{evt.business_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600">{evt.customer_email}</td>
                        <td className="px-6 py-4 text-slate-600">${evt.amount_due?.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            evt.status === 'whatsapp_sent' || evt.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {evt.status === 'whatsapp_sent' ? 'Message Sent' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(evt.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}