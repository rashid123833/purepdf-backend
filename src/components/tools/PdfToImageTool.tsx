import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Download, Sparkles, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/api';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface PageImage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export const PdfToImageTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [renderedPages, setRenderedPages] = useState<PageImage[]>([]);
  const [scale, setScale] = useState<number>(1.5); // 1.5x crisp resolution
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
        setError('Please select a valid PDF file.');
        return;
      }
      setFile(selected);
      setRenderedPages([]);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingPdfOps <= 0) {
      openUpgradeModal();
      return;
    }

    if (!window.pdfjsLib) {
      setError('PDF rendering engine is loading. Please try again in a moment.');
      return;
    }

    setIsRendering(true);
    setError(null);
    setRenderedPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const pages: PageImage[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress({ current: i, total: numPages });
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        const dataUrl = canvas.toDataURL(format, 0.92);
        pages.push({
          pageNumber: i,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setRenderedPages(pages);
    } catch (err: any) {
      console.error('PDF to Image error:', err);
      setError(err.message || 'Failed to render PDF pages to image format.');
    } finally {
      setIsRendering(false);
    }
  };

  const downloadSinglePage = (page: PageImage) => {
    const a = document.createElement('a');
    a.href = page.dataUrl;
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'document';
    a.download = `${baseName}_page_${page.pageNumber}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllPages = () => {
    renderedPages.forEach((page, index) => {
      setTimeout(() => downloadSinglePage(page), index * 200);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">PDF to Image Converter</h2>
            <p className="text-xs text-slate-400">
              Extract every PDF page into ultra-sharp PNG or JPEG images with custom resolution
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

      {/* File Upload Zone */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors text-center relative group">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {file ? file.name : 'Click or drag PDF document here'}
          </p>
          <p className="text-xs text-slate-400">
            {file ? `${formatBytes(file.size)} • Ready to convert` : 'Supports standard multi-page PDFs'}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Image Resolution / Scale
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value={1.0}>1.0x (Standard Web - Fast)</option>
                <option value={1.5}>1.5x (High Definition - Recommended)</option>
                <option value={2.0}>2.0x (Ultra Sharp - Print Quality)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="image/png">PNG (Lossless, Transparent)</option>
                <option value="image/jpeg">JPEG (Compressed, Smaller)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={isRendering}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  Rendering Page {progress.current} of {progress.total}...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract All Pages as Images</span>
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

      {/* Rendered Pages Gallery */}
      {renderedPages.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Extracted {renderedPages.length} High-Res Page{renderedPages.length > 1 ? 's' : ''}
              </h3>
            </div>
            <button
              onClick={downloadAllPages}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download All Images</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {renderedPages.map((page) => (
              <div
                key={page.pageNumber}
                className="group relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden hover:border-cyan-500/50 transition-all p-3"
              >
                <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-sm flex items-center justify-center mb-2">
                  <img
                    src={page.dataUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">Page {page.pageNumber}</span>
                  <button
                    onClick={() => downloadSinglePage(page)}
                    className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white transition-colors"
                    title="Download this page image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
