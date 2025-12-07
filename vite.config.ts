import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This is necessary because 'process.env' does not exist in the browser.
      // We map process.env.API_KEY to the value found in environment variables.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent other process.env usage from crashing the app
      'process.env': {}
    },
  };
});