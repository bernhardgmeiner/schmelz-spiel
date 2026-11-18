import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' damit das Spiel auf GitHub Pages in einem Unterordner läuft
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pruefung: resolve(__dirname, 'pruefung.html'),
      },
    },
  },
});
