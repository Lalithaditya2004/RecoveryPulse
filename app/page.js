"use client";
import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    userEmail: "",
    stripeWebhookSecret: "",
    metaWhatsappToken: "",
    whatsappPhoneNumberId: "",
    stripeSecretKey: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setStatus({
        type: "success",
        message: "Credentials synced successfully!",
      });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8 border border-slate-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            RecoveryPulse
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            One-Click Gateway Setup & WhatsApp Sync
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Founder Account Email
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full p-3 rounded-lg border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
              placeholder="you@saascompany.com"
              value={formData.userEmail}
              onChange={(e) =>
                setFormData({ ...formData, userEmail: e.target.value })
              }
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-semibold text-slate-700">
              Stripe/Lemon Squeezy Webhook Secret
            </label>
            <input
              type="password"
              className="mt-1 block w-full p-3 rounded-lg border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
              placeholder="whsec_..."
              value={formData.stripeWebhookSecret}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stripeWebhookSecret: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Stripe Secret Key
            </label>

            <input
              type="password"
              className="mt-1 block w-full p-3 rounded-lg border border-slate-300"
              placeholder="sk_live_..."
              value={formData.stripeSecretKey}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stripeSecretKey: e.target.value,
                })
              }
            />
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Meta WhatsApp Permanent Token
              </label>
              <input
                type="password"
                className="mt-1 block w-full p-3 rounded-lg border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
                placeholder="EAAbw..."
                value={formData.metaWhatsappToken}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaWhatsappToken: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                className="mt-1 block w-full p-3 rounded-lg border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
                placeholder="1092837465..."
                value={formData.whatsappPhoneNumberId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsappPhoneNumberId: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {status.message && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
          >
            {loading ? "Syncing..." : "Activate One-Click Gateway Sync"}
          </button>
        </form>
      </div>
    </main>
  );
}
