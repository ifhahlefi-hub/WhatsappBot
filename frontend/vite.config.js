import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Baca .env dari ROOT project, bukan dari folder frontend/
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  const adminPort = env.ADMIN_PORT || env.VITE_ADMIN_PORT || '3001'
  const vitePort = env.VITE_PORT || '5173'
  
  console.log(`[vite.config.js] Proxy → http://localhost:${adminPort}`)
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: parseInt(vitePort),
      proxy: {
        '/api': {
          target: `http://localhost:${adminPort}`,
          changeOrigin: true,
        },
        '/socket.io': {
          target: `http://localhost:${adminPort}`,
          ws: true,
          changeOrigin: true,
        }
      }
    }
  }
})
