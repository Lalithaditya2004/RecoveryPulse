"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierInfo, setTierInfo] = useState({ tier: 'none', limit: 0, isActive: false });

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const EVENTS_PER_PAGE = 10;

  // New Pricing Limits (No Free Tier)
  const TIER_LIMITS = { basic: 7, pro: 20 };

  const fetchHistoryEvents = async (userEmail, currentPage) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const from = currentPage * EVENTS_PER_PAGE;
    const to = from + EVENTS_PER_PAGE; 

    const { data: eventData } = await supabase
      .from("payment_events")
      .select("*")
      .eq("founder_email", userEmail)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (eventData) {
      if (eventData.length > EVENTS_PER_PAGE) {
        setHasMoreEvents(true);
        setEvents(eventData.slice(0, EVENTS_PER_PAGE)); 
      } else {
        setHasMoreEvents(false);
        setEvents(eventData);
      }
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }
      setUser(session.user);

      // 2. Fetch Profile & Subscription Status
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('user_email', session.user.email)
        .maybeSingle();

      const currentTier = profile?.subscription_tier?.toLowerCase() || 'none';
      const isActive = profile?.subscription_status === 'active';

      setTierInfo({ 
        tier: currentTier, 
        limit: TIER_LIMITS[currentTier] || 0,
        isActive: isActive 
      });

      // 3. Fetch Businesses
      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_email", session.user.email);

      if (settingsData) setConfigs(settingsData);
      
      // 4. Fetch initial history page
      await fetchHistoryEvents(session.user.email, 0);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistoryEvents(user.email, nextPage);
  };

  const handlePrevPage = () => {
    if (page > 0) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchHistoryEvents(user.email, prevPage);
    }
  };

  // The Pro Feature: CSV Export
  const handleExportCSV = () => {
    if (events.length === 0) return;
    
    const headers = ['Business Name', 'Customer Email', 'Amount', 'Status', 'Date'];
    const csvData = events.map(evt => [
      evt.business_name || 'N/A',
      evt.customer_email,
      evt.amount_due,
      evt.status === 'whatsapp_sent' ? 'Message Sent' : 'Failed',
      new Date(evt.created_at).toLocaleDateString()
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* --- Top Section: Businesses --- */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Businesses</h1>
            </div>
            <div className="text-right">
              {tierInfo.isActive && (
                <div className="text-sm font-medium text-slate-700 capitalize mb-2">
                  {tierInfo.tier} Plan ({configs.length}/{tierInfo.limit})
                </div>
              )}
              
              {/* Dynamic Button Logic based on Subscription */}
              {!tierInfo.isActive ? (
                <Link href="/pricing" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
                  Subscribe to Add Business
                </Link>
              ) : configs.length < tierInfo.limit ? (
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
              <p className="text-slate-500 mb-6">
                {tierInfo.isActive 
                  ? "Connect your first Stripe account to get started." 
                  : "You need an active subscription to connect businesses."}
              </p>
              {!tierInfo.isActive ? (
                <Link href="/pricing" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm">
                  View Pricing Plans
                </Link>
              ) : (
                <Link href="/dashboard/edit" className="px-6 py-3 bg-[#635BFF] text-white font-semibold rounded-lg shadow-sm">
                  Connect with Stripe
                </Link>
              )}
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2 pb-4 -mr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config) => (
                  <div key={config.stripe_account_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-slate-800 truncate pr-2">
                        {config.business_name || "Unnamed Business"}
                      </span>
                      <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </div>
                    
                    <div className="space-y-3 flex-grow">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Stripe ID</p>
                        <p className="text-sm font-mono text-slate-600 truncate">{config.stripe_account_id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* --- Bottom Section: Recovery History --- */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recovery History (Last 30 Days)</h2>
            
            {/* Show Export button ONLY for Pro users */}
            {tierInfo.tier === 'pro' && events.length > 0 && (
              <button 
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>⬇️</span> Export CSV
              </button>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No recovery events recorded in the last 30 days.</div>
            ) : (
              <>
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
                
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Showing Page {page + 1}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handlePrevPage} 
                      disabled={page === 0}
                      className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={handleNextPage} 
                      disabled={!hasMoreEvents}
                      className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}