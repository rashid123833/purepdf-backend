import React, { useState } from 'react';
import { Upload, Bot, Sparkles, Copy, Check, RefreshCw, FileText, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, formatBytes } from '../../utils/api';

export const AiSummarizerTool: React.FC = () => {
  const { user, isPro, remainingAiQueries, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setSummary(null);
      setError(null);
      setIsExtracting(true);

      try {
        const res = await api.extractText(selected);
        setExtractedText(res.text);
      } catch (err: any) {
        setError(err.message || 'Failed to read PDF document text.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleSummarize = async () => {
    if (!extractedText.trim()) {
      setError('No text could be extracted from this PDF. It might be scanned or image-only.');
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

    setIsSummarizing(true);
    setError(null);

    try {
      const res = await api.summarize(extractedText, file?.name || 'Document');
      setSummary(res.summary);
      await refreshUser();
    } catch (err: any) {
      console.error('Summary error:', err);
      setError(err.message || 'Failed to generate AI summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI PDF Summarizer</h2>
            <p className="text-xs text-slate-400">
              Transform dense, multi-page PDFs into concise executive summaries powered by Gemini 3.8
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
            {file ? file.name : 'Click or drag PDF document to summarize'}
          </p>
          <p className="text-xs text-slate-400">
            {isExtracting
              ? 'Analyzing document layout & extracting text...'
              : file
              ? `${formatBytes(file.size)} • ${extractedText.length} characters parsed`
              : 'Contracts, research papers, reports, briefs'}
          </p>
        </div>
      </div>

      {file && extractedText && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-cyan-400" />
              Document Text Extracted ({extractedText.split(/\s+/).length} words)
            </span>
            <span>Target Model: Gemini 3.8 Flash</span>
          </div>

          <button
            onClick={handleSummarize}
            disabled={isSummarizing || isExtracting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-500 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSummarizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Executive AI Summary...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Executive Summary</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {summary && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 space-y-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">AI Executive Summary</h3>
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
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-line leading-relaxed text-sm">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};
