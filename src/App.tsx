/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Workspace } from './components/Workspace';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { PricingView } from './components/PricingView';
import { AuthModal } from './components/auth/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { HostingerDownloadModal } from './components/HostingerDownloadModal';
import { ToolType } from './types';

function AppContent() {
  const { user, isAdmin, openUpgradeModal, openAuthModal } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'workspace' | 'dashboard' | 'admin' | 'pricing'>('home');
  const [activeTool, setActiveTool] = useState<ToolType>('merge');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [hostingerModalOpen, setHostingerModalOpen] = useState(false);

  const handleNavigate = (view: 'home' | 'workspace' | 'dashboard' | 'admin' | 'pricing', tool?: ToolType) => {
    if (view === 'dashboard' && !user) {
      openAuthModal('login');
      return;
    }
    if (view === 'admin' && !isAdmin) {
      openAuthModal('login');
      return;
    }

    if (tool) {
      setActiveTool(tool);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectToolFromLanding = (tool: ToolType) => {
    setActiveTool(tool);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <LandingPage
            onSelectTool={handleSelectToolFromLanding}
            onNavigateToWorkspace={() => handleNavigate('workspace')}
            onOpenUpgrade={openUpgradeModal}
            onNavigateToAdmin={() => handleNavigate('admin')}
          />
        )}

        {currentView === 'workspace' && (
          <Workspace initialTool={activeTool} />
        )}

        {currentView === 'dashboard' && (
          <UserDashboard
            onNavigateToTool={(tool) => {
              setActiveTool(tool);
              setCurrentView('workspace');
            }}
            onOpenUpgrade={openUpgradeModal}
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        )}

        {currentView === 'pricing' && (
          <PricingView
            onOpenUpgrade={openUpgradeModal}
            onNavigateToWorkspace={() => handleNavigate('workspace')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel onOpenHostinger={() => setHostingerModalOpen(true)} />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal />
      <UpgradeModal />
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <HostingerDownloadModal
        isOpen={hostingerModalOpen}
        onClose={() => setHostingerModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
