import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` gera um único index.html autocontido (fácil de hospedar em qualquer CDN).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
})
