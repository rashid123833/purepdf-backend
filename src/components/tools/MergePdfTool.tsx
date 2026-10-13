import React, { useState } from 'react';
import { Upload, FileText, ArrowUp, ArrowDown, Trash2, Download, RefreshCw, CheckCircle2, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadBlob, formatBytes } from '../../utils/api';

export const MergePdfTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; size: number } | null>(null);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
      );
      if (newFiles.length === 0) {
        setError('Please select valid PDF documents.');
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      setDownloadReady(null);
      setError(null);
    }
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setDownloadReady(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
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
    setDownloadReady(null);

    try {
      const mergedBlob = await api.mergePdfs(files);
      setDownloadReady({ blob: mergedBlob, size: mergedBlob.size });
      await refreshUser();
    } catch (err: any) {
      console.error('Merge error:', err);
      setError(err.message || 'Failed to merge PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Merge PDF Files</h2>
            <p className="text-xs text-slate-400">
              Combine multiple PDF documents into a single organized file in your desired order
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
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFilesAdded}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            Click or drag multiple PDF files here
          </p>
          <p className="text-xs text-slate-400">
            You can select 2 or more files and arrange their sequence below
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Files to Merge ({files.length})</span>
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === files.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleMerge}
            disabled={isProcessing || files.length < 2}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Merging Documents...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Merge {files.length} PDFs Now</span>
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
              <h4 className="text-sm font-bold text-white">Files Merged Successfully!</h4>
              <p className="text-xs text-slate-400">
                Unified PDF is ready ({formatBytes(downloadReady.size)})
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadBlob(downloadReady.blob, 'merged_document.pdf')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Merged PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
