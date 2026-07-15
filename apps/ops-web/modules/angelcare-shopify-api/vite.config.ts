import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { embedFrontend } from './scripts/embed-frontend';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const embedPlugin = {
  name: 'embed-template',
  closeBundle() {
    try {
      embedFrontend();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown error';
      process.stderr.write(`embed-frontend failed: ${message}\n`);
      throw e;
    }
  },
};

export default defineConfig({
  root: 'src/views/frontend',
  plugins: [react(), embedPlugin],
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    minify: true,
  },
});
