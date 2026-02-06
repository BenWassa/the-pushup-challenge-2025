/* global __APP_VERSION__ */
import React from 'react';

export default function VersionFooter() {
  return (
    <div className="text-center mt-6 mb-4">
      <p className="text-xs text-[#858585] font-bold tracking-widest uppercase">
        App Version V{__APP_VERSION__}
      </p>
    </div>
  );
}
