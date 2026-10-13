import React, { useState } from 'react';
import { Upload, HelpCircle, Sparkles, Copy, Check, RefreshCw, FileText, Search, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, formatBytes } from '../../utils/api';

export const AiQATool: React.FC = () => {
  const { user, isPro, remainingAiQueries, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [qaResult, setQaResult] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setQaResult(null);
      setError(null);
      setIsExtracting(true);

      try {
        const res = await api.extractText(selected);
        setExtractedText(res.text);
      } catch (err: any) {
        setError(err.message || 'Failed to extract text from PDF.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleGenerateQA = async (isCustom = false) => {
    if (!extractedText.trim()) {
      setError('Please upload a valid PDF document with readable text.');
      return;
    }
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingAiQueries <= 0) {
      openUpgradeModal();
      return;
    }

    if (isCustom && !customQuestion.trim()) {
      setError('Please enter a specific question to answer.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const q = isCustom ? customQuestion.trim() : undefined;
      const res = await api.generateQA(extractedText, file?.name || 'Document', q);
      setQaResult(res.qa);
      await refreshUser();
    } catch (err: any) {
      console.error('QA error:', err);
      setError(err.message || 'Failed to generate Q&A.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!qaResult) return;
    navigator.clipboard.writeText(qaResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI-Powered PDF Q&A</h2>
            <p className="text-xs text-slate-400">
              Generate the most important questions & answers, or ask deep targeted queries
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          AI Queries:{' '}
          <span className="font-semibold text-white">
            {isPro ? 'Unlimited (Pro)' : `${remainingAiQueries} queries left`}
          </span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            {isExtracting ? (
              <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {file ? file.name : 'Click or drag PDF document for Q&A'}
          </p>
          <p className="text-xs text-slate-400">
            {isExtracting
              ? 'Analyzing document text...'
              : file
              ? `${formatBytes(file.size)} • Ready for Q&A generation`
              : 'Auto-synthesizes high-impact questions and answers'}
          </p>
        </div>
      </div>

      {file && extractedText && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-cyan-400" />
              Document Parsed ({extractedText.split(/\s+/).length} words)
            </span>
            <span>Gemini 3.8 Intelligence</span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ask a Specific Question (or generate top 5 below)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="e.g. What are the payment terms in clause 4?"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleGenerateQA(true)}
                disabled={isProcessing || !customQuestion.trim()}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <span>Ask</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Want comprehensive document questions?</span>
            <button
              onClick={() => handleGenerateQA(false)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Generate Top 5 Q&A Overview</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {qaResult && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 space-y-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Questions & Answers</h3>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Q&A</span>
                </>
              )}
            </button>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-line leading-relaxed text-sm">
            {qaResult}
          </div>
        </div>
      )}
    </div>
  );
};
