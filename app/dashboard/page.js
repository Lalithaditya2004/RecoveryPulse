"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW STATE
  const [tierInfo, setTierInfo] = useState({ tier: 'none', limit: 0, isActive: false });

  const [page, setPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const EVENTS_PER_PAGE = 10;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('user_email', session.user.email)
        .maybeSingle();

      const currentTier = profile?.subscription_tier?.toLowerCase() || 'none';
      const isActive = profile?.subscription_status === 'active';

      setTierInfo({ tier: currentTier, limit: TIER_LIMITS[currentTier] || 0, isActive: isActive });

      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_email", session.user.email);

      if (settingsData) setConfigs(settingsData);
      await fetchHistoryEvents(session.user.email, 0);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  // NEW: Refresh Handler
  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    // Reset to page 0 on refresh to get newest data
    setPage(0);
    await fetchHistoryEvents(user.email, 0);
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for visual feedback
  };

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

  const handleAddBusiness = () => {
    if (configs.length >= tierInfo.limit) {
      alert(`Limit Reached: You can only connect ${tierInfo.limit} business(es) on the ${tierInfo.tier} plan.`);
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID; 
    const redirectUri = `${window.location.origin}/api/auth/stripe/callback`;
    const state = encodeURIComponent(user.email);
    window.location.href = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleDeleteBusiness = async (stripeAccountId) => {
    const isConfirmed = window.confirm("Are you sure you want to remove this business? Automated recovery messages will stop immediately.");
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('stripe_account_id', stripeAccountId)
        .eq('user_email', user.email);
      if (error) throw error;
      setConfigs(currentConfigs => currentConfigs.filter(config => config.stripe_account_id !== stripeAccountId));
    } catch (err) {
      alert(`Error removing business: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (events.length === 0) return;
    const headers = ['Business Name', 'Customer Email', 'Amount', 'Status', 'Reason', 'Date'];
    const csvData = events.map(evt => [
      evt.business_name || 'N/A',
      evt.customer_email,
      evt.amount_due,
      evt.status === 'whatsapp_sent' ? 'Message Sent' : 'Failed',
      evt.failure_reason ? `"${evt.failure_reason.replace(/"/g, '""')}"` : 'N/A',
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
        
        <section>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Businesses</h1>
            <div className="text-right">
              {tierInfo.isActive && (
                <div className="text-sm font-medium text-slate-700 capitalize mb-2">
                  {tierInfo.tier} Plan ({configs.length}/{tierInfo.limit})
                </div>
              )}
              {!tierInfo.isActive ? (
                <Link href="/pricing" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
                  Subscribe to Add Business
                </Link>
              ) : configs.length < tierInfo.limit ? (
                <button onClick={handleAddBusiness} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                  + Add Business
                </button>
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
               {tierInfo.isActive ? "Connect your first Stripe account to get started." : "You need an active subscription to connect businesses."}
             </p>
             {!tierInfo.isActive ? (
               <Link href="/pricing" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm">
                 View Pricing Plans
               </Link>
             ) : (
               <button onClick={handleAddBusiness} className="px-6 py-3 bg-[#635BFF] text-white font-semibold rounded-lg shadow-sm hover:bg-[#524BDE] transition-colors">
                 Connect with Stripe
               </button>
             )}
           </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2 pb-4 -mr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config) => (
                  <div key={config.stripe_account_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col group transition-all hover:border-slate-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-slate-800 truncate pr-2">
                        {config.business_name || "Unnamed Business"}
                      </span>
                      <div className="flex items-center gap-3">
                        {tierInfo.isActive ? (
                          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 flex-grow mb-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Stripe ID</p>
                        <p className="text-sm font-mono text-slate-600 truncate">{config.stripe_account_id}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteBusiness(config.stripe_account_id)} className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors">
                        Remove Business
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">Recovery History (Last 30 Days)</h2>
              
              {/* NEW: Refresh Button */}
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-50"
                title="Refresh table"
              >
                <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {tierInfo.tier === 'pro' && events.length > 0 && (
              <button onClick={handleExportCSV} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <span>⬇️</span> Export CSV
              </button>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No recovery events recorded in the last 30 Days.</div>
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
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                evt.status === 'whatsapp_sent' || evt.status === 'success'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {evt.status === 'whatsapp_sent' ? 'Message Sent' : 'Failed'}
                              </span>
                              {/* NEW: Display Failure Reason */}
                              {evt.status === 'failed' && evt.failure_reason && (
                                <span className="text-[10px] text-rose-600 font-medium truncate max-w-[200px]" title={evt.failure_reason}>
                                  {evt.failure_reason}
                                </span>
                              )}
                            </div>
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
                  <span className="text-sm text-slate-500">Showing Page {page + 1}</span>
                  <div className="flex gap-2">
                    <button onClick={handlePrevPage} disabled={page === 0} className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Previous
                    </button>
                    <button onClick={handleNextPage} disabled={!hasMoreEvents} className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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