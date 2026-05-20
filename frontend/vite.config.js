import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  server: {
    port: 5173,
    proxy: {
      '/api/questions/generate': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api/bot-info': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/start-class': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/start-evaluation': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:5253',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
