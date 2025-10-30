import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // expone en red (0.0.0.0)
    port: 5173,
    strictPort: true,
  },
});
