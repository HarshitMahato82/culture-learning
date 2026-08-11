import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production' || command === 'build' || process.env.NODE_ENV === 'production';
  const isHmrDisabled = isProduction || process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in production or when DISABLE_HMR env var is set
      hmr: isHmrDisabled ? false : true,
      // Disable file watching when HMR is disabled to save CPU
      watch: isHmrDisabled ? null : {},
    },
  };
});
