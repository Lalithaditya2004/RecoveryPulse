"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // NEW: Check if the user is already logged in when they hit the homepage
  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // If they are logged in, instantly kick them to the dashboard
        window.location.href = "/dashboard";
      } else {
        // If they are NOT logged in, stop the loading spinner and show the page
        setCheckingSession(false);
      }
    };

    checkActiveSession();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login failed:", error.message);
      setLoading(false);
    }
  };

  // NEW: Show a blank screen or a spinner while checking the session to prevent UI flashing
  if (checkingSession) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg mb-4 font-black text-2xl">
            R⚡️
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Never lose a failed payment again.
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            RecoveryPulse connects your Stripe account directly to WhatsApp. 
            Instantly send recovery links the second a charge/auto-pay declines.
          </p>
        </div>

        {/* Action Section */}
        <div className="pt-8 pb-12">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Connecting..."
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
          <p className="mt-4 text-xs text-slate-500">
            No password required. Secure authentication via Google.
          </p>
        </div>
      </div>
    </main>
  );
}