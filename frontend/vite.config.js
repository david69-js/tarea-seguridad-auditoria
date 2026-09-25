import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * El build se escribe en public/app/ y lo sirve Apache; index.php entrega
 * public/app/index.html para cualquier ruta que no sea /api.
 *
 * En desarrollo (npm run dev) Vite corre en :5173 y reenvia /api y
 * /uploads al contenedor PHP, asi la cookie de sesion queda en el mismo
 * origen que la pagina. Cambie API_URL si su contenedor usa otro puerto.
 */
const API_URL = process.env.API_URL || 'http://localhost:8090';

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': API_URL,
      '/uploads': API_URL,
    },
  },
});
