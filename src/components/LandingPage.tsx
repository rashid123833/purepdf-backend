import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Scissors,
  Minimize2,
  Lock,
  Stamp,
  Image as ImageIcon,
  Bot,
  ListChecks,
  HelpCircle,
  ShieldCheck,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Crown,
  ChevronDown,
  Star,
  FileText,
  Activity,
} from 'lucide-react';
import { ToolType } from '../types';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onSelectTool: (tool: ToolType) => void;
  onNavigateToWorkspace: () => void;
  onOpenUpgrade: () => void;
  onNavigateToAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTool,
  onNavigateToWorkspace,
  onOpenUpgrade,
  onNavigateToAdmin,
}) => {
  const { isPro, isAdmin, settings, openAuthModal } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const price = settings.proPriceInr || 109;

  const faqs = [
    {
      q: 'How does PurePDF AI process my documents?',
      a: 'All PDF operations (merge, split, compress, protect, watermark) run actual native manipulations on purepdf.store using high-performance vector libraries and Ghostscript engines. AI operations use Gemini 3.8 Flash through a secured backend where document text is extracted and analyzed in real-time.',
    },
    {
      q: 'Are my uploaded files kept secure and private?',
      a: 'Yes, 100%. User documents on purepdf.store are processed in private, isolated runtime sessions with strict access controls. Each user only has access to their own document history and operations.',
    },
    {
      q: 'What is included in the ₹109 Pro Plan?',
      a: 'The ₹109 Pro plan provides lifetime access for this demonstration. It unlocks unlimited PDF operations, unlimited Gemini AI queries, up to 100MB file uploads, priority queue processing, and full commercial usage rights.',
    },
    {
      q: 'Can I test PurePDF AI without entering payment details?',
      a: 'Absolutely. Every new account receives a Free Plan with 3 PDF operations and 5 AI queries. You can also use our 1-click Demo Account button to evaluate all features immediately.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-8 overflow-hidden">
        {/* Glowing Orbs Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/25 via-cyan-500/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-semibold">Next-Gen Document Suite Powered by Gemini 3.8</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Work with PDFs at the{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Speed of Thought.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Merge, split, compress, protect, watermark, convert, and converse with any PDF document.
            Unified workflow tools backed by state-of-the-art AI document intelligence.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={onNavigateToWorkspace}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Explore All 11 Tools</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isPro && (
              <button
                onClick={onOpenUpgrade}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Get Pro for ₹{price}</span>
              </button>
            )}
          </div>

          {/* Trust points */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Actual PDF Processing (No Mocks)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Gemini 3.8 AI Integration
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              100% Private Document Isolation
            </span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid: Core PDF Tools */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Essential PDF Operations
          </span>
          <h2 className="text-3xl font-extrabold text-white">
            7 High-Precision Document Tools
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered with industry-standard vector engines for lightning-fast transformations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tool Card: Merge */}
          <div
            onClick={() => onSelectTool('merge')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Merge PDF</h3>
            <p className="text-xs text-slate-400 mb-4">
              Combine multiple PDF documents into a single organized file with customizable order.
            </p>
            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:underline">
              Launch tool <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Tool Card: Split */}
          <div
            onClick={() => onSelectTool('split')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Split PDF</h3>
            <p className="text-xs text-slate-400 mb-4">
              Extract exact page ranges, odd/even pages, or specific subsets with one click.
            </p>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:underline">
              Launch tool <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Tool Card: Compress */}
          <div
            onClick={() => onSelectTool('compress')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <Minimize2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Compress PDF</h3>
            <p className="text-xs text-slate-400 mb-4">
              Downsize file weight by up to 70% while keeping text crisp and vector graphics sharp.
            </p>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:underline">
              Launch tool <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Tool Card: Protect */}
          <div
            onClick={() => onSelectTool('protect')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Protect PDF</h3>
            <p className="text-xs text-slate-400 mb-4">
              Apply 128-bit encryption password locking so only authorized readers can open the file.
            </p>
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 group-hover:underline">
              Launch tool <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Tool Card: Watermark */}
          <div
            onClick={() => onSelectTool('watermark')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
              <Stamp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Add Watermark</h3>
            <p className="text-xs text-slate-400 mb-4">
              Stamp customizable text watermarks across every page with rotation and opacity control.
            </p>
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1 group-hover:underline">
              Launch tool <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Tool Card: Image to PDF */}
          <div
            onClick={() => onSelectTool('img-to-pdf')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Image to PDF</h3>
            <p className="text-xs text-slate-400 mb-4">
              Convert and unify multiple PNG, JPEG, or WebP images into a single cohesive document.
            </p>
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:underline">
              Launch tool <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Tool Card: PDF to Image */}
          <div
            onClick={() => onSelectTool('pdf-to-img')}
            className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 sm:col-span-2 lg:col-span-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">PDF to Image (High Resolution)</h3>
                  <p className="text-xs text-slate-400">
                    Render each PDF page into high-definition PNG or JPEG with thumbnail galleries and single or batch download.
                  </p>
                </div>
              </div>
              <span className="px-4 py-2 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold self-start sm:self-center">
                Launch PDF to Image →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Intelligence Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Powered by Google Gemini 3.8
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              AI Document Intelligence Suite
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Stop skimming hundreds of pages. Let our neural assistants extract facts, answers, and summaries in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onSelectTool('ai-summarize')}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group"
            >
              <Bot className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-white mb-1">AI Summarizer</h4>
              <p className="text-xs text-slate-400">
                Executive overviews, strategic pillars, and actionable next steps.
              </p>
            </div>

            <div
              onClick={() => onSelectTool('ai-chat')}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <Bot className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-white mb-1">Chat with PDF</h4>
              <p className="text-xs text-slate-400">
                Interactive multi-turn conversations grounded in your document text.
              </p>
            </div>

            <div
              onClick={() => onSelectTool('ai-keypoints')}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <ListChecks className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-white mb-1">Extract Key Points</h4>
              <p className="text-xs text-slate-400">
                High-priority metrics, dates, obligations, and critical takeaways.
              </p>
            </div>

            <div
              onClick={() => onSelectTool('ai-qa')}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <HelpCircle className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-white mb-1">AI Q&A Synthesis</h4>
              <p className="text-xs text-slate-400">
                Auto-generates top 5 high-impact questions or answers targeted queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl font-extrabold text-white">
            Free Plan vs. Pro Lifetime
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Start for free, or unlock unlimited operations with a single payment of ₹{price}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Free Starter</h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  Default
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white">
                ₹0 <span className="text-xs text-slate-400 font-normal">forever free</span>
              </div>
              <p className="text-xs text-slate-400">
                Perfect for quick individual document tasks and trying out the AI engine.
              </p>

              <div className="space-y-2.5 pt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 PDF Operations (Merge, Split, Compress, etc.)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>5 Gemini AI Queries</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard processing queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Private document activity history</span>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToWorkspace}
              className="mt-8 w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Use Free Tools
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                LIFETIME PASS
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Pro Lifetime</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">₹{price}</span>
                <span className="text-xs text-slate-400">one-time tutorial fee</span>
              </div>
              <p className="text-xs text-slate-300">
                Unlimited access to all 7 PDF tools and 4 Gemini AI intelligence features.
              </p>

              <div className="space-y-2.5 pt-4 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Unlimited</strong> PDF Operations (No limits)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Unlimited</strong> Gemini 3.8 AI Queries & Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>100MB File Size Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Priority Neural Processing Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant verified activation via UPI / Card</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenUpgrade}
              className="mt-8 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Crown className="w-4 h-4" />
              <span>{isPro ? 'You are already Pro!' : `Activate Pro Now (₹${price})`}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">Everything you need to know about PDF Genius AI</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-indigo-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-white">
                  PurePDF <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono -mt-1">
                  purepdf.store
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <button onClick={() => onSelectTool('merge')} className="hover:text-white">
                Merge PDF
              </button>
              <button onClick={() => onSelectTool('split')} className="hover:text-white">
                Split PDF
              </button>
              <button onClick={() => onSelectTool('compress')} className="hover:text-white">
                Compress PDF
              </button>
              <button onClick={() => onSelectTool('protect')} className="hover:text-white">
                Protect PDF
              </button>
              <button onClick={() => onSelectTool('ai-summarize')} className="hover:text-white">
                AI Summarizer
              </button>
              <button onClick={() => onSelectTool('ai-chat')} className="hover:text-white">
                Chat with PDF
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} PDF Genius AI. Professional Document Intelligence.</p>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToAdmin) {
                    onNavigateToAdmin();
                  } else if (openAuthModal) {
                    openAuthModal('login');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                title={isAdmin ? "Open Admin Panel" : "Admin Login"}
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>{isAdmin ? 'Admin Panel' : 'Admin Login'}</span>
              </button>
              <span>•</span>
              <p className="flex items-center gap-1.5">
                <span>Secure Cloud Architecture</span>
                <span>•</span>
                <span>Gemini 3.8 Flash Powered</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Home Page Bottom-Right Corner: Small Admin Login Button */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          type="button"
          onClick={() => {
            if (onNavigateToAdmin) {
              onNavigateToAdmin();
            } else if (openAuthModal) {
              openAuthModal('login');
            }
          }}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 text-slate-300 hover:text-amber-300 text-xs font-semibold shadow-2xl shadow-black/80 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title={isAdmin ? "Open Admin Panel" : "Admin Login"}
        >
          <Shield className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-[11px]">
            {isAdmin ? 'Admin Panel' : 'Admin Login'}
          </span>
        </button>
      </div>
    </div>
  );
};
