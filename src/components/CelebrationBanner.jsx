import React from 'react';

export default function CelebrationBanner({ title, message }) {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-brand-orange text-white px-6 py-4 rounded-lg shadow-lg text-center">
        <p className="font-bold text-lg">{title}</p>
        <p className="text-sm opacity-90 mt-1">{message}</p>
      </div>
    </div>
  );
}
