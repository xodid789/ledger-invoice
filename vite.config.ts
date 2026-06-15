import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // 폰 접속·터널(트라이클라우드플레어 등 임의 도메인) 허용
    allowedHosts: true,
  },
})
