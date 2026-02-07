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
  storageMode,
  isDemoMode,
  isAuthenticated,
  emailInput,
  setEmailInput,
  passwordInput,
  setPasswordInput,
  onAuthSubmit,
  authLoading,
  authError,
}) {
  const [showPassword, setShowPassword] = React.useState(false);

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

        {!isDemoMode && !isAuthenticated && (
          <Card variant="standard" className="mb-4 shadow-xl">
            <form onSubmit={onAuthSubmit} className="space-y-4">
              <div>
                <label className="form-label text-xs">EMAIL</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input text-base"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="form-label text-xs">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="At least 6 characters"
                    className="form-input text-base pr-16"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-gray-mid hover:text-neutral-gray-text"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {authError && <p className="text-xs text-red-600">{authError}</p>}

              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-lg"
                type="submit"
                disabled={authLoading}
              >
                {authLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Card>
        )}

        {(isDemoMode || isAuthenticated) && (
          <Card variant="standard" className="mb-6 shadow-xl">
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="form-label text-xs">PROFILE NAME</label>
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
                {isDemoMode ? 'Start Demo' : 'Continue'}
              </Button>
            </form>
          </Card>
        )}

        <p className="text-center text-xs text-neutral-gray-mid">
          {isDemoMode
            ? `Demo mode active (${storageMode}): all data stays on this device.`
            : 'Only pre-created accounts can sign in here.'}
        </p>
      </div>
    </div>
  );
}
