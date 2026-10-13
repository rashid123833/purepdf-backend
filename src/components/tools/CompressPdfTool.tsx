import React, { useState } from 'react';
import { Upload, Minimize2, Download, RefreshCw, CheckCircle2, TrendingDown, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadBlob, formatBytes } from '../../utils/api';

export const CompressPdfTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'screen' | 'ebook'>('ebook');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    percentSaved: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingPdfOps <= 0) {
      openUpgradeModal();
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.compressPdf(file, level);
      setResult(res);
      await refreshUser();
    } catch (err: any) {
      console.error('Compress error:', err);
      setError(err.message || 'Failed to compress PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Compress PDF Document</h2>
            <p className="text-xs text-slate-400">
              Drastically downsize your PDF documents while preserving crisp typography and visual quality
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Quota:{' '}
          <span className="font-semibold text-white">
            {isPro ? 'Unlimited (Pro)' : `${remainingPdfOps} ops left`}
          </span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {file ? file.name : 'Click or drag PDF document to compress'}
          </p>
          <p className="text-xs text-slate-400">
            {file ? `${formatBytes(file.size)} • Ready to optimize` : 'Supports large PDFs up to 50MB'}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Compression Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLevel('ebook')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  level === 'ebook'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Standard Compression</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ideal balance between sharp vector readability and significant file reduction.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('screen')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  level === 'screen'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Extreme Compression</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-semibold">
                    MAX SAVINGS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Optimized for email attachments and web upload limits (72-96 DPI).
                </p>
              </button>
            </div>
          </div>

          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Optimizing Streams & Fonts...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Compress PDF Now</span>
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

      {result && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Compression Complete!</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {result.percentSaved}% Saved
            </span>
          </div>

          {/* Size Comparison Card */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-0.5">
                Original Size
              </span>
              <span className="text-base font-bold text-slate-300">
                {formatBytes(result.originalSize)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-0.5">
                Compressed Size
              </span>
              <span className="text-base font-bold text-emerald-400">
                {formatBytes(result.compressedSize)}
              </span>
            </div>
          </div>

          <button
            onClick={() => downloadBlob(result.blob, `compressed_${file?.name || 'document.pdf'}`)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Compressed PDF ({formatBytes(result.compressedSize)})</span>
          </button>
        </div>
      )}
    </div>
  );
};
