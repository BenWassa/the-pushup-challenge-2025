import React, { useEffect, useState, useRef } from 'react';
import DaySummaryPopup from './components/DaySummaryPopup';
import AuthErrorScreen from './components/AuthErrorScreen';
import LoadingScreen from './components/LoadingScreen';
import LoginScreen from './components/LoginScreen';
import UpdateBanner from './components/UpdateBanner';
import CelebrationBanner from './components/CelebrationBanner';
import DashboardHero from './components/DashboardHero';
import NavTabs from './components/NavTabs';
import DashboardView from './components/DashboardView';
import StatsView from './components/StatsView';
import LeaderboardView from './components/LeaderboardView';
import VersionFooter from './components/VersionFooter';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { useLeaderboard } from './hooks/useLeaderboard';
import { getSeason } from './utils';

const VIEWS = {
  DASHBOARD: 'dashboard',
  STATS: 'stats',
  LEADERBOARD: 'leaderboard',
};

export default function App() {
  const { user, loading: loadingAuth, db, appId, error: authError } = useAuth();
  const season = getSeason();
  const isTraining = season === 'TRAINING';

  const [usernameInput, setUsernameInput] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [showCelebration, setShowCelebration] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshingUpdate, setRefreshingUpdate] = useState(false);
  const [dayDetailModalOpen, setDayDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const prevTodayRepsRef = useRef(0);

  const {
    userData,
    todayReps,
    loadingProfile,
    loadUserProfile,
    clearProfile,
    addReps,
    undoLastAction,
    calculateStreak,
    recentLogs,
    lastLogAmount,
    isUndoable,
  } = useUserData({ db, appId, season, isTraining });

  const leaderboardData = useLeaderboard({ db, appId, isTraining, user });

  useEffect(() => {
    if (!user) return;
    const storedName = localStorage.getItem('pushup_username');
    if (storedName) loadUserProfile(storedName);
  }, [loadUserProfile, user]);

  // Detect when daily goal (87) is reached
  useEffect(() => {
    const DAILY_GOAL = 87;
    const shouldCelebrate =
      isTraining && todayReps >= DAILY_GOAL && prevTodayRepsRef.current < DAILY_GOAL;
    prevTodayRepsRef.current = todayReps;
    if (!shouldCelebrate) return;

    const showTimer = setTimeout(() => setShowCelebration(true), 0);
    const hideTimer = setTimeout(() => setShowCelebration(false), 3000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [todayReps, isTraining]);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener('sw-update', handleUpdate);
    return () => window.removeEventListener('sw-update', handleUpdate);
  }, []);

  const handleRefreshUpdate = () => {
    const registration = window.__swRegistration;
    if (!registration || !navigator.serviceWorker) {
      window.location.reload();
      return;
    }

    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, {
      once: true,
    });

    if (registration.waiting) {
      setRefreshingUpdate(true);
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    localStorage.setItem('pushup_username', usernameInput);
    loadUserProfile(usernameInput);
  };

  const handleLogout = () => {
    localStorage.removeItem('pushup_username');
    clearProfile();
    setUsernameInput('');
  };

  if (authError) {
    return (
      <AuthErrorScreen
        updateAvailable={updateAvailable}
        onRefreshUpdate={handleRefreshUpdate}
        refreshingUpdate={refreshingUpdate}
        message={authError.message}
      />
    );
  }

  if (loadingAuth || loadingProfile) {
    return (
      <LoadingScreen
        updateAvailable={updateAvailable}
        onRefreshUpdate={handleRefreshUpdate}
        refreshingUpdate={refreshingUpdate}
      />
    );
  }

  if (!userData) {
    return (
      <LoginScreen
        updateAvailable={updateAvailable}
        onRefreshUpdate={handleRefreshUpdate}
        refreshingUpdate={refreshingUpdate}
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        onSubmit={handleLogin}
      />
    );
  }

  const { training_reps = 0, official_reps = 0 } = userData;
  const DAILY_GOAL = 87;
  const CHALLENGE_GOAL = 2000;
  const heroLabel = "Today's Effort";
  const heroCurrent = todayReps;
  const heroGoal = DAILY_GOAL;
  const heroProgress = heroGoal ? Math.min(heroCurrent / heroGoal, 1) : 0;

  const currentMonthLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-white pb-8 relative max-w-lg mx-auto shadow-2xl">
      {updateAvailable && (
        <UpdateBanner onRefresh={handleRefreshUpdate} refreshing={refreshingUpdate} />
      )}
      {showCelebration && <CelebrationBanner />}
      <DashboardHero
        isTraining={isTraining}
        heroLabel={heroLabel}
        heroCurrent={heroCurrent}
        heroGoal={heroGoal}
        heroProgress={heroProgress}
        official_reps={official_reps}
        challengeGoal={CHALLENGE_GOAL}
        onLogout={handleLogout}
      />

      <NavTabs view={view} views={VIEWS} onChange={setView} />

      <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === VIEWS.DASHBOARD && (
          <DashboardView
            isTraining={isTraining}
            addReps={addReps}
            isUndoable={isUndoable}
            undoLastAction={undoLastAction}
            lastLogAmount={lastLogAmount}
            recentLogs={recentLogs}
          />
        )}

        {view === VIEWS.STATS && (
          <StatsView
            currentMonthLabel={currentMonthLabel}
            userLogs={userData.logs}
            onDateClick={(date) => {
              setSelectedDate(date);
              setDayDetailModalOpen(true);
            }}
            calculateStreak={calculateStreak}
            isTraining={isTraining}
            training_reps={training_reps}
            official_reps={official_reps}
          />
        )}

        {view === VIEWS.LEADERBOARD && (
          <LeaderboardView
            leaderboardData={leaderboardData}
            isTraining={isTraining}
            userId={userData.id}
          />
        )}
      </div>

      <div className="mt-6 mb-4 h-px w-full bg-neutral-gray-light mx-6" />

      <VersionFooter />

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <DaySummaryPopup
        isOpen={dayDetailModalOpen}
        selectedDate={selectedDate}
        logs={userData?.logs || []}
        onClose={() => {
          setDayDetailModalOpen(false);
          setSelectedDate(null);
        }}
      />
    </div>
  );
}
