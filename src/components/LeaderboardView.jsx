import React from 'react';

export default function LeaderboardView({ leaderboardData, isTraining, userId }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-black">Rankings</h3>
        <span className="text-xs text-neutral-gray-mid">
          {isTraining ? 'Training' : 'Official'} Phase
        </span>
      </div>

      {leaderboardData.map((buddy, index) => {
        const isMe = buddy.id === userId;
        const score = isTraining ? buddy.training_reps : buddy.official_reps;
        return (
          <div key={buddy.id} className={`leaderboard-item ${isMe ? 'current-user' : ''}`}>
            <div className="flex items-center gap-4">
              <span className={`leaderboard-rank ${isMe ? 'current-user' : ''}`}>#{index + 1}</span>
              <div>
                <span className="leaderboard-name">{buddy.displayName}</span>
                {isMe && <span className="ml-2 text-xs opacity-75">That's you!</span>}
              </div>
            </div>
            <span className="text-2xl font-bold">{score || 0}</span>
          </div>
        );
      })}
    </div>
  );
}
