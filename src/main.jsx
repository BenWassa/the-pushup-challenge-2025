/* global __APP_VERSION__ */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { getStorageMode, isDemoStorageMode } from './utils/mode';
import { resetDemoUsers } from './utils/localStore';

const demoMode = isDemoStorageMode(getStorageMode());
if (demoMode) resetDemoUsers();

const preventZoom = (event) => {
  if (event.touches && event.touches.length > 1) {
    event.preventDefault();
  }
};

document.addEventListener('gesturestart', preventZoom, { passive: false });
document.addEventListener('gesturechange', preventZoom, { passive: false });
document.addEventListener('gestureend', preventZoom, { passive: false });
document.addEventListener('touchmove', preventZoom, { passive: false });

if (!demoMode && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js?app_version=${__APP_VERSION__}`;
    navigator.serviceWorker
      .register(swUrl, { updateViaCache: 'none' })
      .then((registration) => {
        window.__swRegistration = registration;

        const notifyUpdate = () => {
          if (registration.waiting) {
            window.dispatchEvent(new Event('sw-update'));
          }
        };

        notifyUpdate();

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new Event('sw-update'));
            }
          });
        });
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
