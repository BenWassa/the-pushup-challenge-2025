import React from 'react';
import Card from './Card';
import UpdateBanner from './UpdateBanner';

export default function AuthErrorScreen({
  updateAvailable,
  onRefreshUpdate,
  refreshingUpdate,
  message,
}) {
  return (
    <div className="min-h-screen bg-neutral-white flex items-center justify-center p-4">
      {updateAvailable && (
        <UpdateBanner onRefresh={onRefreshUpdate} refreshing={refreshingUpdate} />
      )}
      <Card className="error-card">
        <div className="text-center">
          <h2 className="error-title">Setup Required</h2>
          <p className="error-message">{message || 'An error occurred. Please try again.'}</p>
          <div className="error-hint">Check the README.md for setup instructions.</div>
        </div>
      </Card>
    </div>
  );
}
