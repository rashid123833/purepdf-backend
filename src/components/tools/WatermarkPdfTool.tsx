import React, { useState } from 'react';
import { Upload, Stamp, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadBlob, formatBytes } from '../../utils/api';

export const WatermarkPdfTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState<'gray' | 'red' | 'blue' | 'black'>('gray');
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

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingPdfOps <= 0) {
      openUpgradeModal();
      return;
    }

    if (!text.trim()) {
      setError('Please provide watermark text.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadReady(null);

    try {
      const watermarkedBlob = await api.watermarkPdf(file, {
        text: text.trim(),
        fontSize,
        opacity,
        rotation,
        color,
      });
      setDownloadReady({ blob: watermarkedBlob, size: watermarkedBlob.size });
      await refreshUser();
    } catch (err: any) {
      console.error('Watermark error:', err);
      setError(err.message || 'Failed to apply watermark to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Stamp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add Watermark to PDF</h2>
            <p className="text-xs text-slate-400">
              Stamp custom text watermarks across every page with adjustable angle, opacity, and color
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
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-purple-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-purple-500/20 group-hover:text-purple-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {file ? file.name : 'Click or drag PDF document to watermark'}
          </p>
          <p className="text-xs text-slate-400">
            {file ? `${formatBytes(file.size)} • Ready to stamp` : 'Supports multi-page documents'}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500 font-bold uppercase"
              />
              <div className="flex gap-1.5 mt-2">
                {['CONFIDENTIAL', 'DO NOT COPY', 'DRAFT', 'OFFICIAL'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(preset)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Color Tint
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'gray', label: 'Gray', colorBg: 'bg-slate-500' },
                  { id: 'red', label: 'Red', colorBg: 'bg-rose-500' },
                  { id: 'blue', label: 'Blue', colorBg: 'bg-blue-500' },
                  { id: 'black', label: 'Black', colorBg: 'bg-black border border-slate-700' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setColor(item.id as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      color === item.id
                        ? 'border-purple-500 bg-purple-950/40 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${item.colorBg}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-slate-400">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="80"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-slate-400">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Rotation</span>
                <span className="font-mono text-slate-400">{rotation}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleApplyWatermark}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Applying Watermark Across Pages...</span>
              </>
            ) : (
              <>
                <Stamp className="w-4 h-4" />
                <span>Stamp Watermark on All Pages</span>
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
              <h4 className="text-sm font-bold text-white">Watermark Stamped Successfully!</h4>
              <p className="text-xs text-slate-400">
                Protected with &ldquo;{text}&rdquo; ({formatBytes(downloadReady.size)})
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadBlob(downloadReady.blob, `watermarked_${file?.name || 'document.pdf'}`)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Watermarked PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
