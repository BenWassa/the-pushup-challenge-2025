import React from 'react';
import { Activity } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import UpdateBanner from './UpdateBanner';

export default function LoginScreen({
  updateAvailable,
  onRefreshUpdate,
  refreshingUpdate,
  usernameInput,
  setUsernameInput,
  onSubmit,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-white via-orange-50/30 to-neutral-white flex flex-col relative overflow-hidden">
      {updateAvailable && (
        <UpdateBanner onRefresh={onRefreshUpdate} refreshing={refreshingUpdate} />
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full relative z-10 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
            Push<span className="text-brand-orange">Up</span>
          </h1>
          <div className="w-16 h-0.5 bg-brand-orange mx-auto my-2" />
          <div className="text-sm font-bold text-neutral-gray-mid tracking-wider">2026</div>
        </div>

        <Card
          variant="soft"
          className="mb-6 bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-brand-orange" />
              </div>
              <h2 className="text-base font-bold text-gray-900">About This Challenge</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Take on <span className="font-bold text-brand-orange">2,000 push-ups</span> for the{' '}
              <span className="font-bold">2,000 lives</span> lost to suicide each day, worldwide.
            </p>
            <div className="pt-2 border-t border-orange-100">
              <p className="text-xs text-gray-600 italic">
                Every rep is a tribute. Every day is progress. Together, we raise awareness and
                remember those we've lost.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="standard" className="mb-6 shadow-xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="form-label text-xs">WHO ARE YOU?</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your name..."
                className="form-input text-base"
                autoFocus
              />
            </div>
            <Button variant="primary" size="lg" className="w-full shadow-lg" type="submit">
              Start Pushing
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-neutral-gray-mid">
          Already using it? Enter your name again to continue.
        </p>
      </div>
    </div>
  );
}
