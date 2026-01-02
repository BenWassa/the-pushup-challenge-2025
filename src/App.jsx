import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Trophy,
  Calendar,
  Flame,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import Button from "./components/Button";
import Card from "./components/Card";
import ProgressBar from "./components/ProgressBar";
import ContributionCalendar from "./components/ContributionCalendar";
import { useAuth } from "./hooks/useAuth";
import { useUserData } from "./hooks/useUserData";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { formatTime, getSeason } from "./utils";

const VIEWS = {
  DASHBOARD: "dashboard",
  STATS: "stats",
  LEADERBOARD: "leaderboard",
};

export default function App() {
  const { user, loading: loadingAuth, db, appId } = useAuth();
  const season = getSeason();
  const isTraining = season === "TRAINING";

  const [usernameInput, setUsernameInput] = useState("");
  const [view, setView] = useState(VIEWS.DASHBOARD);

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
    const storedName = localStorage.getItem("pushup_username");
    if (storedName) loadUserProfile(storedName);
  }, [loadUserProfile, user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    localStorage.setItem("pushup_username", usernameInput);
    loadUserProfile(usernameInput);
  };

  const handleLogout = () => {
    localStorage.removeItem("pushup_username");
    clearProfile();
    setUsernameInput("");
  };

  const viewLabel = useMemo(() => {
    if (view === VIEWS.DASHBOARD) return "Log";
    if (view === VIEWS.STATS) return "Stats";
    return "Rank";
  }, [view]);

  if (loadingAuth || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-[#F2F2F2] rounded-full mb-4" />
          <div className="h-4 w-32 bg-[#F2F2F2] rounded" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2F2F2] rounded-bl-[100px] -z-10 translate-x-20 -translate-y-20 opacity-50" />
        <div className="flex-1 flex flex-col justify-center px-8 max-w-md mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-[60px] font-bold leading-[1.05] mb-4">
              Push
              <br />
              <span className="text-[#FFA400]">Up</span>
            </h1>
            <p className="text-[#5C5C5C] text-lg">
              Join the 2,000 rep challenge.
              <br />
              Start training today.
            </p>
          </div>
          <Card variant="standard" className="mb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#5C5C5C] mb-2">WHO ARE YOU?</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. Dave"
                  className="w-full bg-[#F3F6F8] p-4 rounded-[15px] border-none outline-none focus:ring-2 focus:ring-[#FFA400] text-lg font-bold text-black placeholder-gray-400 transition-all"
                  autoFocus
                />
              </div>
              <Button variant="primary" size="lg" className="w-full" type="submit">
                Start Pushing
              </Button>
            </form>
          </Card>
          <p className="text-center text-sm text-[#858585]">Already using it? Enter your name again.</p>
        </div>
      </div>
    );
  }

  const { training_reps = 0, official_reps = 0 } = userData;

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-24 relative max-w-lg mx-auto shadow-2xl">
      <div className="bg-[#F2F2F2] pt-12 pb-20 px-6 rounded-b-[48px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#FFA400] rounded-bl-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[#858585] text-sm font-bold uppercase tracking-widest mb-1">Current Season</h2>
              <div className="flex items-center gap-2">
                {isTraining ? <Activity className="w-5 h-5 text-[#5C5C5C]" /> : <Trophy className="w-5 h-5 text-[#FFA400]" />}
                <h1 className={`text-2xl font-bold ${isTraining ? "text-[#000000]" : "text-[#FFA400]"}`}>
                  {isTraining ? "Training Camp" : "The Challenge"}
                </h1>
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-[#858585] underline">
              Sign Out
            </button>
          </div>

          <Card variant="standard" className="relative z-20">
            {isTraining ? (
              <div className="space-y-6">
                <ProgressBar current={todayReps} total={71} label="Done Today" subLabel="Target: 71" colorClass="bg-[#5C5C5C]" />
                <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
                  <span className="text-[#858585] text-sm font-medium">Training Total</span>
                  <span className="text-xl font-bold">{training_reps}</span>
                </div>
              </div>
            ) : (
              <div>
                <ProgressBar current={official_reps} total={2000} label="Total Reps" subLabel="Goal: 2000" colorClass="bg-[#FFA400]" />
                <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-[#000000]">{2000 - official_reps}</span>
                    <span className="text-xs text-[#858585]">Remaining</span>
                  </div>
                  <div className="h-8 w-[1px] bg-gray-200" />
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-[#000000]">{Math.ceil((2000 - official_reps) / 28)}</span>
                    <span className="text-xs text-[#858585]">Daily Avg Needed</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="flex justify-center -mt-6 relative z-30 mb-8 px-4">
        <div className="bg-white p-1 rounded-full shadow-lg flex w-full max-w-sm justify-between">
          <button
            onClick={() => setView(VIEWS.DASHBOARD)}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
              view === VIEWS.DASHBOARD ? "bg-[#FFA400] text-white shadow-md" : "text-[#5C5C5C] hover:bg-gray-50"
            }`}
          >
            Log
          </button>
          <button
            onClick={() => setView(VIEWS.STATS)}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
              view === VIEWS.STATS ? "bg-[#FFA400] text-white shadow-md" : "text-[#5C5C5C] hover:bg-gray-50"
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setView(VIEWS.LEADERBOARD)}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
              view === VIEWS.LEADERBOARD ? "bg-[#FFA400] text-white shadow-md" : "text-[#5C5C5C] hover:bg-gray-50"
            }`}
          >
            Rank
          </button>
        </div>
      </div>

      <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === VIEWS.DASHBOARD && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Quick Add</h3>
              <span className="text-xs text-[#858585] font-medium bg-[#F3F6F8] px-3 py-1 rounded-full">
                {isTraining ? "Training Mode" : "Official Mode"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" size="xl" onClick={() => addReps(1)} className="h-32 flex flex-col gap-2">
                <span className="text-3xl font-bold text-black">+1</span>
                <span className="text-xs text-[#858585]">Single</span>
              </Button>
              <Button variant="secondary" size="xl" onClick={() => addReps(10)} className="h-32 flex flex-col gap-2">
                <span className="text-3xl font-bold text-[#FFA400]">+10</span>
                <span className="text-xs text-[#858585]">Set</span>
              </Button>
              <Button variant="secondary" size="xl" onClick={() => addReps(20)} className="h-32 flex flex-col gap-2">
                <span className="text-3xl font-bold text-[#FFA400]">+20</span>
                <span className="text-xs text-[#858585]">Push</span>
              </Button>
              <Button variant="secondary" size="xl" onClick={() => addReps(25)} className="h-32 flex flex-col gap-2 bg-[#F3F6F8]">
                <span className="text-3xl font-bold text-[#FFA400]">+25</span>
                <span className="text-xs text-[#858585]">Big Set</span>
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <Button
                variant={isUndoable ? "danger" : "ghost"}
                size="sm"
                onClick={undoLastAction}
                disabled={!isUndoable}
                className="w-full flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {isUndoable ? `Undo Last (${lastLogAmount > 0 ? "+" : ""}${lastLogAmount})` : "Nothing to Undo"}
              </Button>

              {recentLogs.length > 0 && (
                <div className="bg-[#F3F6F8] rounded-[15px] p-4">
                  <h4 className="text-xs font-bold text-[#858585] uppercase tracking-wider mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {recentLogs.map((log, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-[#5C5C5C]">{formatTime(log.timestamp)}</span>
                        <span className={`font-bold ${log.amount > 0 ? "text-black" : "text-red-500"}`}>
                          {log.amount > 0 ? "+" : ""}
                          {log.amount} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === VIEWS.STATS && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-black">Consistency</h3>
              <div className="flex gap-1 text-[10px] text-[#858585] font-bold uppercase items-center">
                <span>Jan 2026</span>
                <Calendar className="w-3 h-3 ml-1" />
              </div>
            </div>

            <Card variant="soft" className="bg-white">
              <ContributionCalendar logs={userData.logs} />
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFE4B3]" />
                  <span className="text-xs text-[#858585]">Some</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFC966]" />
                  <span className="text-xs text-[#858585]">Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFA400]" />
                  <span className="text-xs text-[#858585]">Great</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F3F6F8] p-5 rounded-[20px] flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 text-[#5C5C5C] font-bold text-sm">
                  <Flame className="w-4 h-4 text-[#FFA400]" />
                  Active Days
                </div>
                <span className="text-3xl font-bold text-black">{calculateStreak()}</span>
              </div>
              <div className="bg-[#F3F6F8] p-5 rounded-[20px] flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 text-[#5C5C5C] font-bold text-sm">
                  <TrendingUp className="w-4 h-4 text-[#FFA400]" />
                  Avg Reps
                </div>
                <span className="text-3xl font-bold text-black">
                  {calculateStreak() > 0 ? Math.round((isTraining ? training_reps : official_reps) / calculateStreak()) : 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.LEADERBOARD && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-black">Rankings</h3>
              <span className="text-xs text-[#858585]">{isTraining ? "Training" : "Official"} Phase</span>
            </div>

            {leaderboardData.map((buddy, index) => {
              const isMe = buddy.id === userData.id;
              const score = isTraining ? buddy.training_reps : buddy.official_reps;
              return (
                <div
                  key={buddy.id}
                  className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                    isMe ? "bg-[#FFA400] text-white shadow-lg scale-105" : "bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-xl w-8 ${isMe ? "text-white/80" : "text-[#FFA400]"}`}>#{index + 1}</span>
                    <div>
                      <span className="block font-bold text-lg capitalize">{buddy.displayName}</span>
                      {isMe && <span className="text-xs opacity-75">That's you!</span>}
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{score || 0}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center mt-12 mb-4">
        <p className="text-xs text-[#858585]">PushUp Challenge • 2026</p>
        <p className="text-[10px] text-[#858585] mt-1">{viewLabel}</p>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}
