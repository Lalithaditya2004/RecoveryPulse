import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} RecoveryPulse. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
            <Link href="/refunds" className="hover:text-indigo-600 transition-colors">Refunds</Link>
            <Link href="/support" className="hover:text-indigo-600 transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}