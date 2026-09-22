import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useGame } from './context/GameContext.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { WaitingRoomPage } from './pages/WaitingRoomPage.js';
import { GameArenaPage } from './pages/GameArenaPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { LeaderboardSection } from './components/public/LeaderboardSection.js';
import { HelpSection } from './components/public/HelpSection.js';
import { Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { gameState, loading: gameLoading } = useGame();
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Intelligent navigation routing based on login & event state
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        if (currentTab === 'login' || currentTab === 'admin_login') {
          setCurrentTab('admin');
        }
      } else if (user.role === 'PLAYER') {
        if (
          currentTab === 'login' ||
          currentTab === 'admin_login' ||
          currentTab === 'home'
        ) {
          if (gameState?.session?.status === 'COMPLETED') {
            setCurrentTab('results');
          } else if (gameState?.event?.status === 'LIVE' || gameState?.event?.status === 'PAUSED') {
            setCurrentTab('game');
          } else {
            setCurrentTab('waiting');
          }
        }
      }
    }
  }, [user, gameState?.event?.status, gameState?.session?.status]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center font-mono text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <Cpu className="w-10 h-10 animate-spin text-cyan-400" />
          <span className="text-xs tracking-widest uppercase">INITIALIZING VSB ECE PLATFORM...</span>
        </div>
      </div>
    );
  }

  const isGameMode = Boolean(
    user?.role === 'PLAYER' &&
    currentTab === 'game' &&
    gameState?.event?.status === 'LIVE' &&
    gameState?.session?.status !== 'COMPLETED'
  );

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-navy-950">
      <Header
        isGameMode={isGameMode}
        currentQuestion={gameState?.session?.current_question || 1}
        totalQuestions={20}
        totalScore={gameState?.session?.total_score || 0}
        deadlineAt={gameState?.deadline_at}
        serverNow={gameState?.server_now}
        onTimeUp={() => {
          if (currentTab === 'game') {
            setCurrentTab('results');
          }
        }}
        onNavigate={(tab) => setCurrentTab(tab)}
        activeTab={currentTab}
      />

      <div className="flex-1">
        {/* Public / Landing Tabs */}
        {currentTab === 'home' && <LandingPage onNavigate={(tab) => setCurrentTab(tab)} />}
        {currentTab === 'rules' && <LandingPage onNavigate={(tab) => setCurrentTab(tab)} />}
        {currentTab === 'club' && <LandingPage onNavigate={(tab) => setCurrentTab(tab)} />}
        {currentTab === 'leaderboard' && <LeaderboardSection />}
        {currentTab === 'help' && <HelpSection />}

        {/* Auth Pages */}
        {currentTab === 'login' && (
          <LoginPage
            initialTab="player"
            onLoginSuccess={(role) => setCurrentTab(role === 'ADMIN' ? 'admin' : 'waiting')}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}
        {currentTab === 'admin_login' && (
          <LoginPage
            initialTab="admin"
            onLoginSuccess={(role) => setCurrentTab(role === 'ADMIN' ? 'admin' : 'waiting')}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {/* Player Game Flow */}
        {currentTab === 'waiting' && <WaitingRoomPage />}
        {currentTab === 'game' && (
          <GameArenaPage onGameComplete={() => setCurrentTab('results')} />
        )}
        {currentTab === 'results' && (
          <ResultsPage onBackToHome={() => setCurrentTab('home')} />
        )}

        {/* Admin Dashboard */}
        {currentTab === 'admin' && <AdminDashboardPage />}
      </div>

      {!isGameMode && <Footer />}
    </div>
  );
};
