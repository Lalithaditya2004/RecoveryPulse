import Link from "next/link";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">
          Recover failed payments automatically. Upgrade as you add more businesses to your portfolio.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:gap-8 text-left">
          {/* Basic Tier */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900">Basic</h3>
            <p className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
              $19<span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
            </p>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex text-sm text-slate-600">✅ 1 Connected Business</li>
              <li className="flex text-sm text-slate-600">✅ Automated WhatsApp Recovery</li>
              <li className="flex text-sm text-slate-600">✅ Standard Support</li>
            </ul>
            <Link href="/signup" className="mt-8 block w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-semibold text-center rounded-lg hover:bg-indigo-100 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-indigo-600 rounded-2xl p-8 shadow-md flex flex-col relative">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-indigo-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
            <p className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
              $49<span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
            </p>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex text-sm text-slate-600">✅ Up to 10 Connected Businesses</li>
              <li className="flex text-sm text-slate-600">✅ Automated WhatsApp Recovery</li>
              <li className="flex text-sm text-slate-600">✅ Priority Support</li>
            </ul>
            <Link href="/signup" className="mt-8 block w-full py-3 px-4 bg-indigo-600 text-white font-semibold text-center rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900">Premium</h3>
            <p className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
              $99<span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
            </p>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex text-sm text-slate-600">✅ Up to 50 Connected Businesses</li>
              <li className="flex text-sm text-slate-600">✅ Automated WhatsApp Recovery</li>
              <li className="flex text-sm text-slate-600">✅ 24/7 Dedicated Support</li>
            </ul>
            <Link href="/signup" className="mt-8 block w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-semibold text-center rounded-lg hover:bg-indigo-100 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}