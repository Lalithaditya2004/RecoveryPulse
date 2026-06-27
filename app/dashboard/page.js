"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [apps, setApps] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = "/";
        return;
      }
      
      setUser(session.user);

      // Fetch their connected apps
      const { data: appData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_email", session.user.email);

      if (appData) setApps(appData);

      // Fetch their recent recovery logs
      const { data: logsData } = await supabase
        .from("payment_events")
        .select("*")
        .eq("founder_email", session.user.email)
        .order("created_at", { ascending: false })
        .limit(10);

      if (logsData) setLogs(logsData);

      setLoading(false);
    };

    fetchUserAndData();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading your workspace...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Nav Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">R⚡️</div>
             <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">{user?.email}</span>
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}
              className="text-sm text-slate-500 hover:text-rose-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats & Actions row */}
        <div className="flex items-center justify-between">
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Active Integrations</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{apps.length}</p>
          </div>
          
          <button 
            onClick={() => window.location.href = "/dashboard/edit"}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {apps.length === 0 ? "+ Onboard Gateway" : "Edit Configuration"}
          </button>
        </div>

        {/* Recovery Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-700">Recent Recovery Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer Email</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No failed payments caught yet. Once a payment fails on your connected account, it will appear here.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-900 font-medium">{log.customer_email}</td>
                      <td className="px-6 py-4 text-slate-600">{log.amount_due}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'whatsapp_sent' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.status === 'whatsapp_sent' ? 'Message Sent' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}