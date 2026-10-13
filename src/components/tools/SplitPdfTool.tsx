import React, { useState } from 'react';
import { Upload, Scissors, Download, RefreshCw, CheckCircle2, FileText, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadBlob, formatBytes } from '../../utils/api';

export const SplitPdfTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState('1');
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; size: number } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setDownloadReady(null);
      setError(null);

      // Attempt to inspect total pages if pdfjsLib or text extractor available
      if (window.pdfjsLib) {
        try {
          const ab = await selected.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
          setTotalPages(pdf.numPages);
          setPageRange(pdf.numPages > 1 ? `1-${Math.min(pdf.numPages, 3)}` : '1');
        } catch (e) {
          setTotalPages(null);
        }
      }
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingPdfOps <= 0) {
      openUpgradeModal();
      return;
    }

    if (!pageRange.trim()) {
      setError('Please specify page numbers to extract (e.g., 1-3, 5).');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadReady(null);

    try {
      const splitBlob = await api.splitPdf(file, pageRange);
      setDownloadReady({ blob: splitBlob, size: splitBlob.size });
      await refreshUser();
    } catch (err: any) {
      console.error('Split error:', err);
      setError(err.message || 'Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = (preset: 'first' | 'odd' | 'even') => {
    if (!totalPages) return;
    if (preset === 'first') {
      setPageRange(`1-${Math.min(3, totalPages)}`);
    } else if (preset === 'odd') {
      const odds = [];
      for (let i = 1; i <= totalPages; i += 2) odds.push(i);
      setPageRange(odds.join(', '));
    } else if (preset === 'even') {
      const evens = [];
      for (let i = 2; i <= totalPages; i += 2) evens.push(i);
      setPageRange(evens.join(', '));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Split PDF Pages</h2>
            <p className="text-xs text-slate-400">
              Extract specific page ranges or individual pages into a clean standalone PDF
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
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-amber-500/20 group-hover:text-amber-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {file ? file.name : 'Click or drag PDF document to split'}
          </p>
          <p className="text-xs text-slate-400">
            {file
              ? `${formatBytes(file.size)}${totalPages ? ` • ${totalPages} pages detected` : ''}`
              : 'Supports standard multi-page documents'}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Specify Pages to Extract</span>
              </label>
              {totalPages && (
                <span className="text-xs text-slate-400">
                  Total document pages: <strong className="text-white">{totalPages}</strong>
                </span>
              )}
            </div>

            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="e.g. 1-3, 5, 8-10"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Use hyphens for ranges (e.g. 1-4) and commas for individual pages (e.g. 1, 3, 5).
            </p>
          </div>

          {totalPages && totalPages > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('first')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                First Pages
              </button>
              <button
                type="button"
                onClick={() => applyPreset('odd')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Odd Pages
              </button>
              <button
                type="button"
                onClick={() => applyPreset('even')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Even Pages
              </button>
            </div>
          )}

          <button
            onClick={handleSplit}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Splitting Document...</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>Extract Selected Pages</span>
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

      {downloadReady && (
        <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Pages Extracted Successfully!</h4>
              <p className="text-xs text-slate-400">
                New PDF document generated ({formatBytes(downloadReady.size)})
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadBlob(downloadReady.blob, `split_${file?.name || 'document.pdf'}`)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Split PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
