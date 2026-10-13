import React, { useState } from 'react';
import { Upload, Lock, ShieldCheck, Download, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadBlob, formatBytes } from '../../utils/api';

export const ProtectPdfTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; size: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDownloadReady(null);
      setError(null);
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingPdfOps <= 0) {
      openUpgradeModal();
      return;
    }

    if (!password || password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadReady(null);

    try {
      const protectedBlob = await api.protectPdf(file, password);
      setDownloadReady({ blob: protectedBlob, size: protectedBlob.size });
      await refreshUser();
    } catch (err: any) {
      console.error('Protect error:', err);
      setError(err.message || 'Failed to encrypt PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Password Protect PDF</h2>
            <p className="text-xs text-slate-400">
              Encrypt your confidential PDF files with 128-bit industry standard security
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
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-rose-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-rose-500/20 group-hover:text-rose-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {file ? file.name : 'Click or drag PDF document to protect'}
          </p>
          <p className="text-xs text-slate-400">
            {file ? `${formatBytes(file.size)} • Ready to encrypt` : 'Secures sensitive documents'}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter Document Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secret password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type secret password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Anyone who tries to open this document will be prompted for this exact password.
            </span>
          </div>

          <button
            onClick={handleProtect}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Encrypting Document...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Protect Document with Password</span>
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
              <h4 className="text-sm font-bold text-white">Document Protected Successfully!</h4>
              <p className="text-xs text-slate-400">
                Encrypted with 128-bit security ({formatBytes(downloadReady.size)})
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadBlob(downloadReady.blob, `protected_${file?.name || 'document.pdf'}`)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Encrypted PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
