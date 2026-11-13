import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the build works from any static host subpath (e.g. GitHub Pages)
  base: './',
  plugins: [react()],
})
