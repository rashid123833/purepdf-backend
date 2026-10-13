import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Bot,
  Crown,
  LayoutDashboard,
  Shield,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ToolType } from '../types';

interface NavbarProps {
  currentView: 'home' | 'workspace' | 'dashboard' | 'admin' | 'pricing';
  onNavigate: (view: 'home' | 'workspace' | 'dashboard' | 'admin' | 'pricing', tool?: ToolType) => void;
  onOpenProfile: () => void;
  onOpenHostinger?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenProfile }) => {
  const { user, isPro, isAdmin, logout, openAuthModal, openUpgradeModal, settings } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      {settings.announcement && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 px-4 py-1.5 text-center text-xs text-indigo-300 border-b border-indigo-900/40 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>{settings.announcement}</span>
          {!isPro && (
            <button
              onClick={openUpgradeModal}
              className="ml-2 underline font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Get Pro for ₹{settings.proPriceInr}
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              PurePDF <span className="text-cyan-400">AI</span>
            </span>
            <span className="text-[10px] text-cyan-400/90 font-mono -mt-1 tracking-wider lowercase">
              purepdf.store
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'home'
                ? 'text-white bg-slate-800/80'
                : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate('workspace', 'merge')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              currentView === 'workspace'
                ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-800/40'
                : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            PDF Tools
          </button>

          <button
            onClick={() => onNavigate('workspace', 'ai-summarize')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              currentView === 'workspace'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
                : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            AI Intelligence
          </button>

          <button
            onClick={() => onNavigate('pricing')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'pricing'
                ? 'text-white bg-slate-800/80'
                : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            Pricing
          </button>

          {user && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                currentView === 'dashboard'
                  ? 'text-white bg-slate-800/80'
                  : 'hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Dashboard
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                currentView === 'admin'
                  ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Admin
            </button>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {!isPro ? (
            <button
              onClick={openUpgradeModal}
              className="relative group overflow-hidden rounded-xl p-px font-semibold text-xs transition duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-400"></span>
              <span className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] bg-slate-950 text-white font-medium group-hover:bg-slate-900 transition-colors">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Go Pro</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                  ₹{settings.proPriceInr}
                </span>
              </span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-emerald-400" />
              <span>PRO ACTIVE</span>
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {user.role === 'admin' ? 'Administrator' : user.plan.toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px]">
                      <span className="text-slate-400">Plan:</span>
                      <span
                        className={`font-semibold ${
                          isPro ? 'text-emerald-400' : 'text-indigo-400'
                        }`}
                      >
                        {user.plan.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                    Account Profile
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-amber-400 hover:bg-slate-800/60 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      Admin Control Panel
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-800"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-2">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('home');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900"
          >
            Home
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('workspace', 'merge');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            PDF Tools
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('workspace', 'ai-summarize');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            AI Intelligence
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('pricing');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900"
          >
            Pricing
          </button>
          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('dashboard');
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              User Dashboard
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('admin');
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-amber-400 hover:bg-slate-900 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Admin Panel
            </button>
          )}
        </div>
      )}
    </header>
  );
};
