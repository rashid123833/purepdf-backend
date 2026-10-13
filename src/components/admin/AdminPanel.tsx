import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  Crown,
  FileText,
  Bot,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  RotateCcw,
  IndianRupee,
  Save,
  Database,
  Copy,
  Check,
  Download,
  Server,
  ExternalLink,
  FolderArchive,
  UserCheck,
  UserX,
  Filter,
  ToggleLeft,
  ToggleRight,
  Cloud,
  Layers,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, downloadFileViaBlob } from '../../utils/api';
import { AdminStats, User, Transaction, PlatformSettings } from '../../types';

interface AdminPanelProps {
  onOpenHostinger?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onOpenHostinger }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'downloads' | 'transactions' | 'database'>('users');
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const [statsData, usersData, txnsData, settingsData, dbData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminTransactions(),
        api.getSettings(),
        api.getDatabaseInfo().catch(() => null),
      ]);

      setStats(statsData);
      setUsers(usersData.users || []);
      setTransactions(txnsData.transactions || []);
      setSettings(settingsData.settings);
      if (dbData) setDbInfo(dbData);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to fetch administrator data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMySQL = async () => {
    setTestingDb(true);
    try {
      const res = await api.testMySQL();
      setStatusMsg({
        type: res.connected ? 'success' : 'error',
        text: `MySQL Status: ${res.statusMessage}`,
      });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to test MySQL connection' });
    } finally {
      setTestingDb(false);
    }
  };

  const handleCopySql = () => {
    if (dbInfo?.sqlScript) {
      navigator.clipboard.writeText(dbInfo.sqlScript);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    }
  };

  const handleDownloadSql = async () => {
    try {
      setDownloadingZip('sql');
      setStatusMsg({ type: 'success', text: 'Downloading purepdf_schema.sql...' });
      await downloadFileViaBlob('/api/database/schema-sql', 'purepdf_schema.sql');
      setStatusMsg({ type: 'success', text: 'purepdf_schema.sql downloaded successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to download SQL schema' });
    } finally {
      setDownloadingZip(null);
    }
  };

  const handleDownloadPublicHtml = async () => {
    try {
      setDownloadingZip('public_html');
      setStatusMsg({ type: 'success', text: 'Downloading public_html.zip for Hostinger...' });
      await downloadFileViaBlob('/api/download/public-html-zip', 'public_html.zip');
      setStatusMsg({ type: 'success', text: 'public_html.zip downloaded successfully! Extract it inside public_html in cPanel.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to download public_html.zip' });
    } finally {
      setDownloadingZip(null);
    }
  };

  const handleDownloadFullstack = async () => {
    try {
      setDownloadingZip('fullstack');
      setStatusMsg({ type: 'success', text: 'Downloading full-stack project zip...' });
      await downloadFileViaBlob('/api/download/fullstack-zip', 'purepdf_fullstack_project.zip');
      setStatusMsg({ type: 'success', text: 'purepdf_fullstack_project.zip downloaded successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to download full-stack zip' });
    } finally {
      setDownloadingZip(null);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 my-12">
        <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">Administrator Access Required</h2>
        <p className="text-xs text-slate-400">
          This panel is restricted to authorized platform administrators. Please log in with an administrator account (e.g. admin@pdfgenius.ai).
        </p>
      </div>
    );
  }

  const handleTogglePlan = async (userId: string, currentPlan: 'free' | 'pro') => {
    const targetPlan = currentPlan === 'free' ? 'pro' : 'free';
    try {
      await api.toggleUserPlan(userId, targetPlan);
      setStatusMsg({ type: 'success', text: `User plan updated to ${targetPlan.toUpperCase()}.` });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleResetQuota = async (userId: string) => {
    try {
      await api.resetUserQuota(userId);
      setStatusMsg({ type: 'success', text: 'User operation and query quotas reset to 0.' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.deleteUser(userId);
      setStatusMsg({ type: 'success', text: 'User removed from system.' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus?: string) => {
    const targetStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await api.updateUserStatus(userId, targetStatus);
      setStatusMsg({
        type: 'success',
        text: targetStatus === 'active' ? 'Account activated successfully!' : 'Account deactivated / suspended.',
      });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleApproveUser = async (userId: string, grantPro = false) => {
    try {
      await api.approveUser(userId, grantPro ? 'pro' : 'free');
      setStatusMsg({
        type: 'success',
        text: `User account approved and activated${grantPro ? ' with Pro Plan' : ''}!`,
      });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject and deactivate this user?')) return;
    try {
      await api.rejectUser(userId);
      setStatusMsg({ type: 'success', text: 'User registration/access rejected.' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setStatusMsg({ type: 'success', text: 'Platform configuration updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.plan.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);

    const userStatus = u.status || 'active';
    const matchesStatus = userStatusFilter === 'all' || userStatus === userStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Administrator Control Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SUPERADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage platform users, verify ₹109 Pro payments, monitor tool metrics, and adjust system limits
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Users
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-white">{stats.totalUsers}</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Pro Members
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-amber-400">{stats.proUsers}</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Free Users
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-slate-300">{stats.freeUsers}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              PDF Operations
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-indigo-400">{stats.totalPdfOps}</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              AI Queries
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-cyan-400">{stats.totalAiQueries}</span>
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Revenue
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-emerald-400">₹{stats.totalRevenue}</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Members & Approvals ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Plans & Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'downloads'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>ZIP Downloads & Cloud Deployment</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>MySQL & phpMyAdmin</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payments ({transactions.length})</span>
        </button>
      </div>

      {/* Tab: Database & MySQL */}
      {activeTab === 'database' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>MySQL Database & phpMyAdmin Integration</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    purepdf.store
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Target Database: <strong className="text-white font-mono">u553556584_purepdf</strong> • User: <strong className="text-white font-mono">u553556584_Rashidpdf</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
              >
                {sqlCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>SQL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All SQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadSql}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download schema.sql</span>
              </button>

              <button
                type="button"
                disabled={testingDb}
                onClick={handleTestMySQL}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
                <span>Test MySQL</span>
              </button>
            </div>
          </div>

          {/* Configuration Cards from User Screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                MySQL Database
              </span>
              <span className="text-sm font-bold text-white font-mono">
                u553556584_purepdf
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Hostinger cPanel</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                MySQL User
              </span>
              <span className="text-sm font-bold text-indigo-300 font-mono">
                u553556584_Rashidpdf
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Full Privileges</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Website Domain
              </span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                purepdf.store
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Live Production</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Backend Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">
                  {dbInfo?.database?.connected ? 'MySQL Active' : 'Online / Sync Ready'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                {dbInfo?.database?.statusMessage || 'Local cache synchronized'}
              </span>
            </div>
          </div>

          {/* Download Packages for Hostinger public_html */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Hostinger Deployment Packages (public_html)</h4>
                  <p className="text-[11px] text-slate-400">
                    Hostinger File Manager me upload karne ke liye ready-to-use zip files
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    Recommended
                  </span>
                  <h5 className="text-xs font-bold text-white mt-1">public_html.zip</h5>
                  <p className="text-[10px] text-slate-400">
                    Contains index.html, assets (CSS/JS), .htaccess SPA rewrite, and deployment guide.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={downloadingZip === 'public_html'}
                  onClick={handleDownloadPublicHtml}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-600/20"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingZip === 'public_html' ? 'animate-bounce' : ''}`} />
                  <span>{downloadingZip === 'public_html' ? 'Downloading...' : 'Download public_html.zip'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    Full Source
                  </span>
                  <h5 className="text-xs font-bold text-white mt-1">Full-Stack Project ZIP</h5>
                  <p className="text-[10px] text-slate-400">
                    Complete Node.js/Express backend + MySQL connector, routes, and client files.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={downloadingZip === 'fullstack'}
                  onClick={handleDownloadFullstack}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingZip === 'fullstack' ? 'animate-bounce' : ''}`} />
                  <span>{downloadingZip === 'fullstack' ? 'Downloading...' : 'Download Full-Stack ZIP'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    Database
                  </span>
                  <h5 className="text-xs font-bold text-white mt-1">purepdf_schema.sql</h5>
                  <p className="text-[10px] text-slate-400">
                    SQL file for phpMyAdmin import (users, history, transactions, settings tables).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={downloadingZip === 'sql'}
                  onClick={handleDownloadSql}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingZip === 'sql' ? 'animate-bounce' : ''}`} />
                  <span>{downloadingZip === 'sql' ? 'Downloading...' : 'Download schema.sql'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* phpMyAdmin Instructions */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>How to Run this SQL in phpMyAdmin (Kaise Run Karein)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center mb-1.5">
                  1
                </span>
                <p className="font-semibold text-white mb-0.5">Enter phpMyAdmin</p>
                <p className="text-[11px] text-slate-400">
                  Hostinger cPanel me jakar &quot;Enter phpMyAdmin&quot; button par click karein.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center mb-1.5">
                  2
                </span>
                <p className="font-semibold text-white mb-0.5">Select Database</p>
                <p className="text-[11px] text-slate-400">
                  Left side me database <strong className="text-slate-200">u553556584_purepdf</strong> select karein.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center mb-1.5">
                  3
                </span>
                <p className="font-semibold text-white mb-0.5">Click SQL Tab</p>
                <p className="text-[11px] text-slate-400">
                  Upar top menu me <strong className="text-slate-200">SQL</strong> tab par click karein.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center mb-1.5">
                  4
                </span>
                <p className="font-semibold text-white mb-0.5">Paste & Click Go</p>
                <p className="text-[11px] text-slate-400">
                  Neeche diya gaya SQL code paste karein aur <strong className="text-slate-200">Go</strong> button dabayein!
                </p>
              </div>
            </div>
          </div>

          {/* SQL Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>SQL Schema Code (Copy this code for phpMyAdmin)</span>
              </label>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
              <div className="p-4 max-h-[380px] overflow-y-auto text-slate-300 whitespace-pre leading-relaxed selection:bg-cyan-500 selection:text-black">
                {dbInfo?.sqlScript || `-- Loading SQL schema...`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users & Member Management */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Members & Access Control</span>
                <span className="text-xs font-normal text-slate-400">({filteredUsers.length} shown)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Search members, approve/reject registrations, activate/deactivate accounts, and grant Pro access.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, plan..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap border-b border-slate-800/80 pb-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            <button
              type="button"
              onClick={() => setUserStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                userStatusFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({users.length})
            </button>

            <button
              type="button"
              onClick={() => setUserStatusFilter('active')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                userStatusFilter === 'active'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Active ({users.filter((u) => (u.status || 'active') === 'active').length})
            </button>

            <button
              type="button"
              onClick={() => setUserStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                userStatusFilter === 'pending'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              Pending Approval ({users.filter((u) => u.status === 'pending').length})
            </button>

            <button
              type="button"
              onClick={() => setUserStatusFilter('suspended')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                userStatusFilter === 'suspended'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-rose-300 border border-slate-800'
              }`}
            >
              <XCircle className="w-3 h-3 text-rose-400" />
              Deactivated ({users.filter((u) => u.status === 'suspended').length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-3">Usage (PDF / AI)</th>
                  <th className="py-3 px-3 text-right">Approve / Active / Plan Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No members matched the filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const status = u.status || 'active';
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.id === user?.id && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Joined: {new Date(u.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit ${
                              u.plan === 'pro'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.plan === 'pro' && <Crown className="w-3 h-3 text-amber-300" />}
                            {u.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {status === 'active' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ACTIVE
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-amber-400" />
                              PENDING APPROVAL
                            </span>
                          )}
                          {status === 'suspended' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              DEACTIVATED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">
                          <span className="text-slate-200">{u.pdfOpsCount}</span>
                          <span className="text-slate-500"> / </span>
                          <span className="text-cyan-400">{u.aiQueriesCount}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* If pending approval, show Approve and Reject */}
                            {status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveUser(u.id, false)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                                  title="Approve User"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveUser(u.id, true)}
                                  className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                                  title="Approve & Grant Pro Plan"
                                >
                                  <Crown className="w-3 h-3" />
                                  <span>Approve + Pro</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectUser(u.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                                  title="Reject User"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* Activate / Deactivate Toggle Button */}
                            {status !== 'pending' && u.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id, status)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                  status === 'active'
                                    ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                }`}
                                title={status === 'active' ? 'Deactivate this account' : 'Activate this account'}
                              >
                                {status === 'active' ? (
                                  <>
                                    <UserX className="w-3 h-3 text-slate-400" />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-400" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Plan Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleTogglePlan(u.id, u.plan)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                                u.plan === 'pro'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                              }`}
                              title={u.plan === 'pro' ? 'Downgrade to Free' : 'Grant Pro Unlimited'}
                            >
                              {u.plan === 'pro' ? 'Downgrade' : 'Grant Pro'}
                            </button>

                            {/* Reset Quota Button */}
                            <button
                              type="button"
                              onClick={() => handleResetQuota(u.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Reset Usage Quotas (Sets ops count to 0)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User Button */}
                            {u.id !== user?.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Permanently Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Payment & Upgrade Transactions</h3>
            <p className="text-xs text-slate-400">
              Verified records of Pro activations (₹109 tutorial fee)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Transaction Ref</th>
                  <th className="py-3 px-3">User Email</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-indigo-300 font-medium">
                      {t.transactionRef}
                    </td>
                    <td className="py-3 px-3 text-white">{t.userEmail}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">₹{t.amount}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px] flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Plans & Pricing */}
      {activeTab === 'plans' && settings && (
        <form onSubmit={handleSaveSettings} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Plans & Pricing Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Edit Pro membership pricing, free tier usage quotas, and member onboarding rules for purepdf.store
            </p>
          </div>

          {/* Pricing Control */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>Pro Plan Price (Indian Rupees ₹)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={settings.proPriceInr}
                  onChange={(e) =>
                    setSettings({ ...settings, proPriceInr: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {[109, 199, 299, 499].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSettings({ ...settings, proPriceInr: amt })}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      settings.proPriceInr === amt
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              This price is displayed on the pricing modal, upgrade dialogs, and UPI payment buttons.
            </p>
          </div>

          {/* Free Tier Quotas */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Free Plan Quotas & Limits</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Free PDF Operations Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={settings.freePdfOpsLimit}
                  onChange={(e) =>
                    setSettings({ ...settings, freePdfOpsLimit: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Free users can execute this many PDF merges, compressions, splits, etc.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Free AI Queries Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={settings.freeAiQueriesLimit}
                  onChange={(e) =>
                    setSettings({ ...settings, freeAiQueriesLimit: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Free users can execute this many Gemini Flash summaries or questions.</p>
              </div>
            </div>
          </div>

          {/* Member Registration & Onboarding Controls */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Member Registration & Approval Rules</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">Public User Registration</p>
                  <p className="text-[11px] text-slate-400">Allow new visitors to register an account</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, allowNewRegistrations: settings.allowNewRegistrations === false ? true : false })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    settings.allowNewRegistrations !== false
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {settings.allowNewRegistrations !== false ? 'ALLOWED' : 'CLOSED'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">Require Admin Approval</p>
                  <p className="text-[11px] text-slate-400">New accounts require manual approval</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, requireApproval: !settings.requireApproval })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    settings.requireApproval
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {settings.requireApproval ? 'REQUIRED' : 'AUTO-ACTIVE'}
                </button>
              </div>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Platform Announcement Banner Text
            </label>
            <input
              type="text"
              value={settings.announcement}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Welcome to PurePDF AI! Pro accounts get unlimited tools."
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Plans & Platform Configuration</span>
          </button>
        </form>
      )}

      {/* Tab: Downloads & Cloud Deployment Hub */}
      {activeTab === 'downloads' && (
        <div className="space-y-6">
          {/* Top Cards for Direct Download */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: public_html.zip */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">public_html.zip</h4>
                <p className="text-xs text-slate-400">
                  Hostinger cPanel ke <strong>public_html</strong> folder me extract karne ke liye updated static frontend build.
                </p>
                <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 p-2 rounded-lg border border-cyan-800/40">
                  Destination: Hostinger &gt; public_html/
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href="/api/download/public-html-zip"
                  download="public_html.zip"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download public_html.zip</span>
                </a>
                <p className="text-[10px] text-center text-slate-500">Direct instant download</p>
              </div>
            </div>

            {/* Card 2: purepdf_fullstack_project.zip */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Full-Stack Project ZIP</h4>
                <p className="text-xs text-slate-400">
                  Complete Node.js, Express API server, Gemini AI logic, aur database handlers for Render.com ya Railway.
                </p>
                <div className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 p-2 rounded-lg border border-indigo-800/40">
                  Deploy to: Render.com / Railway.app
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href="/api/download/fullstack-zip"
                  download="purepdf_fullstack_project.zip"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download fullstack.zip</span>
                </a>
                <p className="text-[10px] text-center text-slate-500">Includes server.ts & dependencies</p>
              </div>
            </div>

            {/* Card 3: schema.sql */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">MySQL Database Schema</h4>
                <p className="text-xs text-slate-400">
                  phpMyAdmin me database <strong>u553556584_purepdf</strong> me tables aur superadmin seed karne ke liye SQL script.
                </p>
                <div className="text-[11px] font-mono text-amber-300 bg-amber-950/60 p-2 rounded-lg border border-amber-800/40">
                  Run in: Hostinger &gt; phpMyAdmin &gt; SQL
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href="/api/database/schema-sql"
                  download="purepdf_schema.sql"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download schema.sql</span>
                </a>
                <p className="text-[10px] text-center text-slate-500">SQL table creation code</p>
              </div>
            </div>
          </div>

          {/* Render.com & Railway Deployment Guide */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Render.com / Railway.app Step-by-Step Backend Deployment Guide
                </h3>
                <p className="text-xs text-slate-400">
                  Hostinger Shared Hosting Node.js background process allow nahi karti, is liye backend Render.com par free me deploy hota hai.
                </p>
              </div>
            </div>

            {/* Step by step cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-cyan-600/30 text-cyan-300 font-bold flex items-center justify-center">
                  1
                </div>
                <h5 className="font-bold text-white">Render.com par Account Banayein</h5>
                <p className="text-slate-400 leading-relaxed">
                  <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">render.com</a> par free account banayein aur &quot;New +&quot; par click karke <strong>Web Service</strong> select karein.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center">
                  2
                </div>
                <h5 className="font-bold text-white">Build & Start Command Set Karein</h5>
                <p className="text-slate-400 leading-relaxed">
                  <strong>Build Command:</strong> <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">npm install && npm run build</code>
                  <br />
                  <strong>Start Command:</strong> <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">node server.ts</code>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center">
                  3
                </div>
                <h5 className="font-bold text-white">Environment Variables Add Karein</h5>
                <p className="text-slate-400 leading-relaxed">
                  Render ke &quot;Environment Variables&quot; section me neeche diye gaye Hostinger MySQL credentials paste karein.
                </p>
              </div>
            </div>

            {/* Copyable Environment Variables Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Copy-Paste Environment Variables for Render / Railway
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const envText = `DB_HOST=localhost\nDB_PORT=3306\nDB_NAME=u553556584_purepdf\nDB_USER=u553556584_Rashidpdf\nDB_PASSWORD=Rashid@pdf123\nJWT_SECRET=purepdf_secret_jwt_key_2026_secure_rashid\nPORT=3000\nSITE_DOMAIN=purepdf.store`;
                    navigator.clipboard.writeText(envText);
                    setStatusMsg({ type: 'success', text: 'Environment variables copied to clipboard!' });
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Variables</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`DB_HOST=localhost
DB_PORT=3306
DB_NAME=u553556584_purepdf
DB_USER=u553556584_Rashidpdf
DB_PASSWORD=Rashid@pdf123
JWT_SECRET=purepdf_secret_jwt_key_2026_secure_rashid
PORT=3000
SITE_DOMAIN=purepdf.store`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Footer */}
      <div className="pt-6 mt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300 font-medium">PurePDF Admin Console</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500 text-[11px]">purepdf.store</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHostinger && (
            <button
              type="button"
              onClick={onOpenHostinger}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-all shadow-sm cursor-pointer"
              title="Open Hostinger deployment guide & files"
            >
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deployment Hub</span>
            </button>
          )}

          <button
            type="button"
            disabled={downloadingZip === 'public_html'}
            onClick={handleDownloadPublicHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Download public_html.zip"
          >
            <Download className={`w-3.5 h-3.5 text-cyan-400 ${downloadingZip === 'public_html' ? 'animate-bounce' : ''}`} />
            <span>{downloadingZip === 'public_html' ? 'Downloading...' : 'Download public_html'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
