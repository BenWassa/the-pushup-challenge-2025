/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const cfg = {
    plugins: [
      react(),
      {
        name: 'pushup-precache-manifest',
        generateBundle(_options, bundle) {
          this.emitFile({
            type: 'asset',
            fileName: 'precache-manifest.json',
            source: JSON.stringify(Object.keys(bundle).filter((file) => /\.(js|css)$/.test(file))),
          });
        },
      },
    ],
    base: '/the-pushup-challenge-2025/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      outDir: 'dist',
    },
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
