import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true, // ← ポート衝突なら即エラー
    proxy: {
      // 開発中のみ有効。previewや本番静的配信では効かない点に注意
      '/api': {
        target: 'http://localhost:8901',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});