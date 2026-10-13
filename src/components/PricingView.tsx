import React from 'react';
import { Crown, CheckCircle2, XCircle, Zap, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PricingViewProps {
  onOpenUpgrade: () => void;
  onNavigateToWorkspace: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onOpenUpgrade, onNavigateToWorkspace }) => {
  const { isPro, settings, openAuthModal } = useAuth();
  const price = settings.proPriceInr || 109;

  const comparisonFeatures = [
    { name: 'PDF Operations (Merge, Split, Watermark, etc.)', free: '3 operations', pro: 'Unlimited' },
    { name: 'Gemini 3.8 AI Queries (Summarize, Chat, Q&A)', free: '5 queries', pro: 'Unlimited' },
    { name: 'Maximum Upload File Size', free: '15 MB', pro: '100 MB' },
    { name: 'Processing Queue Priority', free: 'Standard', pro: 'High Priority (Instant)' },
    { name: 'Batch Processing & Image Extraction', free: 'Limited', pro: 'Full Access' },
    { name: 'Document Privacy & Encryption', free: 'Included', pro: 'Included' },
    { name: 'Commercial Rights & Ad-Free Studio', free: 'No', pro: 'Yes' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5" />
          <span>One-Time Tutorial Price</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Transparent, No-Nonsense Plans
        </h1>
        <p className="text-sm text-slate-400">
          Start for free, or unlock lifetime unlimited PDF tools & Gemini intelligence for just ₹{price}.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Starter */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Free Starter</h2>
            <div className="text-4xl font-extrabold text-white">
              ₹0 <span className="text-xs text-slate-400 font-normal">forever free</span>
            </div>
            <p className="text-xs text-slate-400">
              Basic access to try out our PDF transformation and AI summarization features.
            </p>
            <div className="space-y-3 pt-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>3 PDF Operations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5 AI Document Queries</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Standard conversion speed</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToWorkspace}
            className="mt-8 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Go to Workspace
          </button>
        </div>

        {/* Pro Lifetime */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Pro Lifetime</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                BEST VALUE
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">₹{price}</span>
              <span className="text-xs text-slate-400">one-time tutorial demonstration fee</span>
            </div>

            <p className="text-xs text-slate-300">
              Full unlimited access across all 7 PDF tools and 4 Gemini neural AI capabilities.
            </p>

            <div className="space-y-3 pt-4 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Unlimited</strong> PDF Operations (Merge, Split, Compress, etc.)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Unlimited</strong> AI Queries, Summaries & Chat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100MB File Size Limits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority Processing Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Instant verified payment via UPI or Cards</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenUpgrade}
            className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Crown className="w-4 h-4" />
            <span>{isPro ? 'Pro Already Activated' : `Unlock Pro for ₹${price}`}</span>
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white mb-2">Detailed Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="py-3 px-3">Feature</th>
                <th className="py-3 px-3">Free Plan</th>
                <th className="py-3 px-3 font-bold text-amber-400">Pro Lifetime (₹{price})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {comparisonFeatures.map((f, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-medium text-white">{f.name}</td>
                  <td className="py-3 px-3 text-slate-400">{f.free}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-400">{f.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
