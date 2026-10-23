import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';

const lanIp =
  Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address || '';

export default defineConfig(async () => {
  const plugins = [react()];
  try {
    const sslPkg = '@vitejs/' + 'plugin-basic-ssl';
    const mod = await import(sslPkg);
    const basicSsl = mod.default || mod;
    if (typeof basicSsl === 'function') plugins.push(basicSsl());
  } catch {
    // Runs cleanly over HTTP if @vitejs/plugin-basic-ssl is not installed
  }

  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins,
    define: { __LAN_IP__: JSON.stringify(lanIp) },
    server: {
      host: true,
      port: 5173,
      proxy: { '/api': 'http://localhost:8787' },
      fs: { allow: ['.'] },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
