// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL: la URL pública (en Vercel, por ejemplo https://calistrainer.vercel.app).
// Se usa para el canonical y la imagen al compartir el link.
const site = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export default defineConfig({
  site,
  image: {
    // Permite que Astro procese imágenes servidas por Sanity si hace falta.
    domains: ['cdn.sanity.io'],
  },
});
