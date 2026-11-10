import { defineConfig } from 'vite';

export default defineConfig({
  // Wrangler's automatic Cloudflare Vite setup needs an explicit plugin list.
  // It can safely add @cloudflare/vite-plugin to this array during setup.
  plugins: [],
  base: '/',
  build: { target: 'es2022', sourcemap: true, assetsInlineLimit: 4096 },
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
});
