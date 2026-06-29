"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();

    // Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-bold text-indigo-600 tracking-tight">RecoveryPulse</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-sm font-medium text-slate-600 hidden sm:block">
                  {user.email}
                </span>
                {/* <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                  Dashboard
                </Link> */}
                <button 
                  onClick={handleSignOut} 
                  className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Sign In
              </Link>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}