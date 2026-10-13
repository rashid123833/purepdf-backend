import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FolderArchive,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Server,
  ExternalLink,
  Layers,
  ArrowRight,
  HardDrive,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api, downloadFileViaBlob, formatBytes } from '../utils/api';

interface HostingerDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PublicFileInfo {
  name: string;
  path: string;
  size: number;
}

export const HostingerDownloadModal: React.FC<HostingerDownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'packages' | 'files' | 'guide'>('packages');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filesList, setFilesList] = useState<PublicFileInfo[]>([]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [activeFileKey, setActiveFileKey] = useState<'htaccess' | 'indexHtml' | 'readme' | 'schema'>('htaccess');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFilesList();
      loadContent(activeFileKey);
    }
  }, [isOpen]);

  const loadFilesList = async () => {
    try {
      const res = await api.getPublicFilesList();
      if (res && res.files) {
        setFilesList(res.files);
      }
    } catch {
      // fallback static list
      setFilesList([
        { name: 'index.html', path: 'index.html', size: 1767 },
        { name: '.htaccess', path: '.htaccess', size: 407 },
        { name: 'schema.sql', path: 'schema.sql', size: 5808 },
        { name: 'README_HOSTINGER.txt', path: 'README_HOSTINGER.txt', size: 878 },
        { name: 'index-CvpBR-cr.js', path: 'assets/index-CvpBR-cr.js', size: 725874 },
        { name: 'index-Bi8hXna6.css', path: 'assets/index-Bi8hXna6.css', size: 76351 },
      ]);
    }
  };

  const loadContent = async (key: 'htaccess' | 'indexHtml' | 'readme' | 'schema') => {
    setActiveFileKey(key);
    try {
      const res = await api.getFileContent(key);
      setFileContent(res.content || '');
    } catch {
      setFileContent('// Loading preview...');
    }
  };

  if (!isOpen) return null;

  const handleDownload = async (url: string, filename: string) => {
    try {
      setDownloading(filename);
      setStatusMsg({ type: 'success', text: `${filename} download shuru ho raha hai...` });
      await downloadFileViaBlob(url, filename);
      setStatusMsg({ type: 'success', text: `Success! ${filename} aapke computer me download ho gaya hai.` });
    } catch (err: any) {
      console.warn('Blob download fallback:', err);
      // Fallback: trigger standard link
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.download = filename;
      fallbackLink.target = '_blank';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
      setStatusMsg({ type: 'success', text: `${filename} download link trigger ho gaya hai.` });
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-indigo-950/50 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Hostinger Deployment Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  purepdf.store
                </span>
              </div>
              <p className="text-xs text-slate-400">
                public_html ke tamam files download karein aur Hostinger me upload karein
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b transition-all ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 sm:px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Download ZIP Packages</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Next Kya Karna Hai? (Guide)</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'files'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Individual Files & Code</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          {/* TAB 1: ZIP PACKAGES */}
          {activeTab === 'packages' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Database create ho gaya! Ab ye zip upload karein:</h4>
                    <p className="text-xs text-cyan-200/80">
                      Neeche diya gaya <strong>public_html.zip</strong> download karein aur Hostinger File Manager me extract karein.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. public_html.zip */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border-2 border-cyan-500/40 relative flex flex-col justify-between hover:border-cyan-400 transition-all shadow-lg shadow-cyan-950/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 tracking-wider uppercase">
                        Sabse Zaroori (Main)
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">~184 KB</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                        <FolderArchive className="w-4 h-4 text-cyan-400" />
                        <span>public_html.zip</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Hostinger cPanel ke <strong>public_html</strong> folder ke liye complete website package. Isme index.html, assets (CSS/JS), aur .htaccess shamil hen.
                      </p>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1 border border-slate-800 font-mono">
                      <div>✓ index.html</div>
                      <div>✓ .htaccess (Router Rewrite)</div>
                      <div>✓ assets/ (CSS & JS)</div>
                      <div>✓ README_HOSTINGER.txt</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      disabled={downloading === 'public_html.zip'}
                      onClick={() => handleDownload('/api/download/public-html-zip', 'public_html.zip')}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
                    >
                      <Download className={`w-4 h-4 ${downloading === 'public_html.zip' ? 'animate-bounce' : ''}`} />
                      <span>{downloading === 'public_html.zip' ? 'Downloading...' : 'Download public_html.zip'}</span>
                    </button>
                    <a
                      href="/api/download/public-html-zip"
                      download="public_html.zip"
                      className="text-[10px] text-center block text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      Direct link fallback (agar button na chale)
                    </a>
                  </div>
                </div>

                {/* 2. Full-Stack Project ZIP */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                        Full Node.js Source
                      </span>
                      <span className="text-[11px] font-mono text-indigo-400">~306 KB</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-indigo-400" />
                        <span>Full-Stack ZIP</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        PurePDF ka complete Node.js / Express backend + MySQL connector code (VPS ya Cloud Run deployment ke liye).
                      </p>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1 border border-slate-800 font-mono">
                      <div>✓ server.ts & server/routes.ts</div>
                      <div>✓ server/db.ts (MySQL config)</div>
                      <div>✓ package.json & tsconfig</div>
                      <div>✓ Complete client sources</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      disabled={downloading === 'purepdf_fullstack_project.zip'}
                      onClick={() => handleDownload('/api/download/fullstack-zip', 'purepdf_fullstack_project.zip')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      <Download className={`w-4 h-4 ${downloading === 'purepdf_fullstack_project.zip' ? 'animate-bounce' : ''}`} />
                      <span>{downloading === 'purepdf_fullstack_project.zip' ? 'Downloading...' : 'Download Full-Stack ZIP'}</span>
                    </button>
                    <a
                      href="/api/download/fullstack-zip"
                      download="purepdf_fullstack_project.zip"
                      className="text-[10px] text-center block text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Direct link fallback
                    </a>
                  </div>
                </div>

                {/* 3. purepdf_schema.sql */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                        MySQL Database
                      </span>
                      <span className="text-[11px] font-mono text-amber-400">~6 KB</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>purepdf_schema.sql</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        phpMyAdmin ke liye SQL table structure (users, transactions, history, settings) aur pre-seeded admin user.
                      </p>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1 border border-slate-800 font-mono">
                      <div>✓ DB: u553556584_purepdf</div>
                      <div>✓ User: u553556584_Rashidpdf</div>
                      <div>✓ Tables: users, history, txns</div>
                      <div>✓ Admin: admin@purepdf.store</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      disabled={downloading === 'purepdf_schema.sql'}
                      onClick={() => handleDownload('/api/database/schema-sql', 'purepdf_schema.sql')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      <Download className={`w-4 h-4 ${downloading === 'purepdf_schema.sql' ? 'animate-bounce' : ''}`} />
                      <span>{downloading === 'purepdf_schema.sql' ? 'Downloading...' : 'Download schema.sql'}</span>
                    </button>
                    <a
                      href="/api/database/schema-sql"
                      download="purepdf_schema.sql"
                      className="text-[10px] text-center block text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      Direct link fallback
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">
                <h4 className="text-sm font-bold text-white mb-1">Aapke Database Tables Create Ho Chuke Hen! Ab Next Kya Karna Hai?</h4>
                <p className="text-xs text-indigo-200/80">
                  Aapka MySQL database ab ready hai. Ab sirf 4 aasan steps me apni website ko Hostinger par live karein:
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 border border-cyan-500/30">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-white">public_html.zip Download Karein</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Upar diye gaye pehle tab se <strong className="text-cyan-300">public_html.zip</strong> button par click karke zip file apne computer par download karein.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 border border-cyan-500/30">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-white">Hostinger File Manager Kholen</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Hostinger dashboard (hPanel) me jayein &rarr; <strong>Websites</strong> &rarr; <strong className="text-slate-200">purepdf.store</strong> ke samne <strong>Manage</strong> par click karein &rarr; <strong>File Manager</strong> open karein.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 border border-cyan-500/30">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-white">public_html Folder me Upload & Extract Karein</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      File Manager me <strong className="text-cyan-300">public_html</strong> folder par double click karke uske andar jaein.
                    </p>
                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-1 mt-2 pl-2">
                      <li>Top menu me <strong>Upload Files</strong> icon dabayein aur <strong>public_html.zip</strong> select karein.</li>
                      <li>Upload hone ke baad, <strong>public_html.zip</strong> par right-click karein aur <strong>Extract</strong> dabayein.</li>
                      <li>Extract destination me <code className="text-cyan-300 font-mono">public_html</code> hi rehne dein aur Extract karein.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-500/30">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-emerald-400">Website Check Karein (Live!)</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ab apne browser me <a href="https://purepdf.store" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">https://purepdf.store</a> open karein!
                    </p>
                    <p className="text-xs text-slate-300">
                      Aapka PurePDF AI complete SaaS website live chalega! Aap apne admin account se login kar sakte hen:
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 mt-2 flex flex-col sm:flex-row gap-3">
                      <span>Email: <strong>admin@purepdf.store</strong></span>
                      <span>Password: <strong>Rashid@pdf123</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INDIVIDUAL FILES & CODE */}
          {activeTab === 'files' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400">
                Agar aapke browser me zip file download na ho ya antivirus block kare, toh aap yahan se har file ko alag-alag download ya copy kar sakte hen:
              </p>

              {/* File list cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filesList.map((file) => (
                  <div
                    key={file.path}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{file.path}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(`/api/download/file/${file.path}`, file.name)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Code viewer for key config files */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">File Preview:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => loadContent('htaccess')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          activeFileKey === 'htaccess'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        .htaccess
                      </button>
                      <button
                        onClick={() => loadContent('indexHtml')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          activeFileKey === 'indexHtml'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        index.html
                      </button>
                      <button
                        onClick={() => loadContent('schema')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          activeFileKey === 'schema'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        schema.sql
                      </button>
                      <button
                        onClick={() => loadContent('readme')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          activeFileKey === 'readme'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        README
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyText(fileContent, activeFileKey)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    {copiedFile === activeFileKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
                  <div className="p-4 max-h-[260px] overflow-y-auto text-slate-300 whitespace-pre leading-relaxed">
                    {fileContent || '// Loading...'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span>Domain: <strong className="text-white">purepdf.store</strong></span>
            <span>•</span>
            <span>Target folder: <code className="text-cyan-400 font-mono">public_html</code></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={downloading === 'public_html.zip'}
              onClick={() => handleDownload('/api/download/public-html-zip', 'public_html.zip')}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download public_html.zip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
