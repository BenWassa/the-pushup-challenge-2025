/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const cfg = {
    plugins: [react()],
    base: '/the-pushup-challenge-2025/',
  };

  // During dev, ensure requests for manifest.webmanifest (even at nested paths)
  // return the actual JSON manifest instead of the index HTML (avoids parse errors).
  if (command === 'serve') {
    cfg.configureServer = (server) => {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('manifest.webmanifest')) {
          try {
            const manifestPath = path.resolve(process.cwd(), 'public', 'manifest.webmanifest');
            const body = fs.readFileSync(manifestPath, 'utf8');
            res.setHeader('Content-Type', 'application/manifest+json');
            res.end(body);
            return;
          } catch {
            // fall through to next middleware
          }
        }
        next();
      });
    };
  }

  return cfg;
});
