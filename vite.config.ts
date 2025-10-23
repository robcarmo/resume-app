import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose API_KEY at build time for client-side use
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || ''),
  },
})
