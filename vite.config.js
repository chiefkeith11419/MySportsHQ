import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets make the build portable on GitHub Pages regardless of repo name.
  base: './',
});
