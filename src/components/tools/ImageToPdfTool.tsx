import React, { useState } from 'react';
import { Upload, Image as ImageIcon, ArrowUp, ArrowDown, Trash2, Download, RefreshCw, CheckCircle2, FilePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadBlob, formatBytes } from '../../utils/api';

interface ImageItem {
  file: File;
  previewUrl: string;
}

export const ImageToPdfTool: React.FC = () => {
  const { user, isPro, remainingPdfOps, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; size: number } | null>(null);

  const handleImagesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (added.length === 0) {
        setError('Please select valid PNG or JPEG images.');
        return;
      }

      const items: ImageItem[] = added.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...items]);
      setDownloadReady(null);
      setError(null);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const list = [...images];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setImages(list);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].previewUrl);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setDownloadReady(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please add at least one image.');
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
      const files = images.map((i) => i.file);
      const pdfBlob = await api.imagesToPdf(files);
      setDownloadReady({ blob: pdfBlob, size: pdfBlob.size });
      await refreshUser();
    } catch (err: any) {
      console.error('Image to PDF error:', err);
      setError(err.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Image to PDF Converter</h2>
            <p className="text-xs text-slate-400">
              Convert multiple photos, documents, and illustrations (JPG/PNG) into a single PDF
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
          accept="image/*"
          multiple
          onChange={handleImagesAdded}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            Click or drag image files here
          </p>
          <p className="text-xs text-slate-400">
            Supports PNG, JPEG, WebP. Add one or multiple files and arrange their order.
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-indigo-400" />
              <span>Images to Convert ({images.length})</span>
            </h3>
            <button
              onClick={() => {
                images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                setImages([]);
              }}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((item, idx) => (
              <div
                key={`${item.file.name}-${idx}`}
                className="relative group rounded-2xl bg-slate-950 border border-slate-800 p-2.5 flex flex-col justify-between"
              >
                <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden mb-2 relative">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/70 text-[10px] font-bold text-white flex items-center justify-center backdrop-blur-sm">
                    {idx + 1}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                    {item.file.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveImage(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move left"
                    >
                      <ArrowUp className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      onClick={() => moveImage(idx, 'down')}
                      disabled={idx === images.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move right"
                    >
                      <ArrowDown className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-950/40"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleConvert}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating High-Resolution PDF...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>Convert {images.length} Images to PDF Document</span>
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
              <h4 className="text-sm font-bold text-white">Images Converted to PDF!</h4>
              <p className="text-xs text-slate-400">
                Unified PDF document is ready ({formatBytes(downloadReady.size)})
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadBlob(downloadReady.blob, 'converted_images.pdf')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Converted PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
