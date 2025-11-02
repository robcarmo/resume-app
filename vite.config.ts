import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose Gemini API key at build time for client-side use
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || ''),
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || ''),
  },
})
