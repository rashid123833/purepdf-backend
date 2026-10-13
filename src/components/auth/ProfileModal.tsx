import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Shield, Crown, KeyRound, Check, Calendar, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser, isPro, openUpgradeModal, settings } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (user) setName(user.name);
    setMessage(null);
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data: any = {};
      if (name.trim() !== user.name) data.name = name.trim();
      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      const res = await api.updateProfile(data);
      setMessage({ type: 'success', text: res.message || 'Profile updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Account Status Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
              Membership
            </span>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  isPro ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                {user.plan.toUpperCase()}
              </span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openUpgradeModal();
                  }}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
                >
                  Upgrade (₹{settings.proPriceInr})
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
              Account Role
            </span>
            <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" />
              {user.role === 'admin' ? 'Administrator' : 'Standard User'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
              PDF Operations
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" />
              {user.pdfOpsCount} used {isPro ? '(Unlimited)' : `/ ${settings.freePdfOpsLimit}`}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
              AI Queries
            </span>
            <span className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              {user.aiQueriesCount} used {isPro ? '(Unlimited)' : `/ ${settings.freeAiQueriesLimit}`}
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Display Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Change Password (Optional)
            </h4>
            <div className="space-y-2.5">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
