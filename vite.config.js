import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // listen on the LAN so a phone on the same Wi-Fi can reach it
    port: 5173,
  },
});
