import React from 'react';
import Button from './Button';

export default function UpdateBanner({ onRefresh, refreshing }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="card-soft flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-black">Update available</p>
          <p className="text-xs text-neutral-gray-text">Tap refresh to get the latest version.</p>
        </div>
        <Button variant="primary" size="sm" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
}
