import React from 'react';
import UpdateBanner from './UpdateBanner';

export default function LoadingScreen({ updateAvailable, onRefreshUpdate, refreshingUpdate }) {
  return (
    <div className="min-h-screen bg-neutral-white flex items-center justify-center p-4">
      {updateAvailable && (
        <UpdateBanner onRefresh={onRefreshUpdate} refreshing={refreshingUpdate} />
      )}
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-neutral-gray-light rounded-full mb-4" />
        <div className="h-4 w-32 bg-neutral-gray-light rounded" />
      </div>
    </div>
  );
}
