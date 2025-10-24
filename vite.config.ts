import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose API_KEY at build time for client-side use
    // Priority order:
    // 1. API_KEY - Used in Docker builds (via --build-arg)
    // 2. VITE_API_KEY - Used in local development (from .env file)
    // 3. Empty string - Fallback (will cause runtime error)
    // 
    // Note: This value will be embedded in the JavaScript bundle and visible to users.
    // Always restrict your API key in Google Cloud Console. See SECURITY.md for details.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || ''),
  },
})
