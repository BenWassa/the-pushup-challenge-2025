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
  const DAILY_GOAL = 87;
  const { user, loading: loadingAuth, db, appId, error: authError } = useAuth();
  const season = getSeason();
  const isTraining = season === 'TRAINING';

  const [usernameInput, setUsernameInput] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [celebrationToast, setCelebrationToast] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshingUpdate, setRefreshingUpdate] = useState(false);
  const [dayDetailModalOpen, setDayDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const prevTodayRepsRef = useRef(null);
  const toastTimerRef = useRef(null);

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

  // Show a toast when the daily goal is hit and when reps keep increasing past goal.
  useEffect(() => {
    if (prevTodayRepsRef.current === null) {
      prevTodayRepsRef.current = todayReps;
      return;
    }

    const previousReps = prevTodayRepsRef.current;
    const increasedTodayReps = todayReps > previousReps;
    const justHitGoal = previousReps < DAILY_GOAL && todayReps >= DAILY_GOAL;
    const surpassedGoalFurther = previousReps >= DAILY_GOAL && increasedTodayReps;

    prevTodayRepsRef.current = todayReps;
    if (!(justHitGoal || surpassedGoalFurther)) return;

    const overGoalBy = Math.max(0, todayReps - DAILY_GOAL);
    const title = justHitGoal ? '🎉 Daily Goal Hit! 🎉' : '🔥 Still Building Momentum';
    const message = justHitGoal
      ? `Great work. You reached ${todayReps} reps today.`
      : `You're now ${overGoalBy} over goal at ${todayReps} reps.`;

    const showTimer = setTimeout(() => {
      setCelebrationToast({ title, message });
    }, 0);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setCelebrationToast(null);
      toastTimerRef.current = null;
    }, 3000);

    return () => clearTimeout(showTimer);
  }, [todayReps, DAILY_GOAL]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
  const CHALLENGE_GOAL = 2000;
  const heroLabel = "Today's Effort";
  const heroCurrent = todayReps;
  const heroGoal = DAILY_GOAL;

  const currentMonthLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-white pb-8 relative max-w-lg mx-auto shadow-2xl">
      {updateAvailable && (
        <UpdateBanner onRefresh={handleRefreshUpdate} refreshing={refreshingUpdate} />
      )}
      {celebrationToast && (
        <CelebrationBanner title={celebrationToast.title} message={celebrationToast.message} />
      )}
      <DashboardHero
        isTraining={isTraining}
        heroLabel={heroLabel}
        heroCurrent={heroCurrent}
        heroGoal={heroGoal}
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
