import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

function copyExtensionIcons() {
  return {
    name: 'copy-extension-icons',
    closeBundle() {
      const rootDir = __dirname;
      const distIconsDir = path.resolve(rootDir, 'dist/icons');
      fs.mkdirSync(distIconsDir, { recursive: true });

      for (const fileName of ['icon16.png', 'icon48.png', 'icon128.png']) {
        fs.copyFileSync(
          path.resolve(rootDir, 'icons', fileName),
          path.resolve(distIconsDir, fileName)
        );
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    webExtension(),
    copyExtensionIcons(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});