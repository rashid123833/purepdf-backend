import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Crown,
  FileText,
  Bot,
  Activity,
  Calendar,
  Layers,
  Scissors,
  Minimize2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Download,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, formatBytes } from '../../utils/api';
import { HistoryItem, ToolType } from '../../types';

interface UserDashboardProps {
  onNavigateToTool: (tool: ToolType) => void;
  onOpenUpgrade: () => void;
  onOpenProfile: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigateToTool,
  onOpenUpgrade,
  onOpenProfile,
}) => {
  const { user, isPro, settings } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getHistory();
      setHistory(res.history || []);
    } catch (e) {
      console.warn('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (!user) return null;

  const pdfOpsLimit = settings.freePdfOpsLimit || 3;
  const aiQueriesLimit = settings.freeAiQueriesLimit || 5;

  const pdfUsagePct = isPro
    ? 100
    : Math.min(100, Math.round(((user.pdfOpsCount || 0) / pdfOpsLimit) * 100));

  const aiUsagePct = isPro
    ? 100
    : Math.min(100, Math.round(((user.aiQueriesCount || 0) / aiQueriesLimit) * 100));

  const filteredHistory = history.filter((h) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      h.toolName.toLowerCase().includes(q) ||
      h.fileName.toLowerCase().includes(q) ||
      h.resultSummary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Account Overview Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-indigo-500/25">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border flex items-center gap-1 ${
                  isPro
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}
              >
                <Crown className="w-3 h-3" />
                {user.plan.toUpperCase()} PLAN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {user.role === 'admin' ? 'Administrator' : 'Standard Member'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {!isPro ? (
            <button
              onClick={onOpenUpgrade}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Upgrade to Pro (₹{settings.proPriceInr})</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-emerald-400" />
              <span>Pro Lifetime Member</span>
            </div>
          )}

          <button
            onClick={onOpenProfile}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Quota & Usage Limit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PDF Operations Quota */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">PDF Operations</h3>
                <p className="text-[11px] text-slate-400">Merge, Split, Compress, Watermark, Convert</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-300">
              {isPro ? 'Unlimited' : `${user.pdfOpsCount} / ${pdfOpsLimit}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPro
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 w-full'
                    : pdfUsagePct >= 100
                    ? 'bg-rose-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${pdfUsagePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>
                {isPro
                  ? 'Active with no limits'
                  : `${Math.max(0, pdfOpsLimit - user.pdfOpsCount)} operations remaining`}
              </span>
              <span>{isPro ? 'PRO TIER' : `${pdfUsagePct}% used`}</span>
            </div>
          </div>
        </div>

        {/* AI Queries Quota */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Queries & Chat</h3>
                <p className="text-[11px] text-slate-400">Summarize, Chat with PDF, Key Points, Q&A</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-300">
              {isPro ? 'Unlimited' : `${user.aiQueriesCount} / ${aiQueriesLimit}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPro
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 w-full'
                    : aiUsagePct >= 100
                    ? 'bg-rose-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${aiUsagePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>
                {isPro
                  ? 'Powered by Gemini 3.8 Flash'
                  : `${Math.max(0, aiQueriesLimit - user.aiQueriesCount)} queries remaining`}
              </span>
              <span>{isPro ? 'PRO TIER' : `${aiUsagePct}% used`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
          Quick Launch Tools
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateToTool('merge')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
          >
            <Layers className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Merge PDF</span>
            <span className="text-[10px] text-slate-400">Combine files</span>
          </button>

          <button
            onClick={() => onNavigateToTool('compress')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
          >
            <Minimize2 className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Compress PDF</span>
            <span className="text-[10px] text-slate-400">Downsize document</span>
          </button>

          <button
            onClick={() => onNavigateToTool('ai-summarize')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
          >
            <Bot className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">AI Summarizer</span>
            <span className="text-[10px] text-slate-400">Instant overview</span>
          </button>

          <button
            onClick={() => onNavigateToTool('ai-chat')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-left transition-all group"
          >
            <Sparkles className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Chat with PDF</span>
            <span className="text-[10px] text-slate-400">Ask questions</span>
          </button>
        </div>
      </div>

      {/* Document Processing History Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Document Processing History</span>
            </h3>
            <p className="text-xs text-slate-400">
              Private activity log of your processed documents and AI analysis
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Filter history..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading activity history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No operations recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Process a document using any PDF or AI tool to see your activity records here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Tool Used</th>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">File Size</th>
                  <th className="py-3 px-3">Result / Activity</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/60 font-mono text-[11px]">
                        {item.toolName}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200 max-w-[200px] truncate">
                      {item.fileName}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatBytes(item.fileSize)}
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-[260px] truncate">
                      {item.resultSummary}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
