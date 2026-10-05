import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Dirección del admin publicado: https://calistrainer.sanity.studio
  studioHost: 'calistrainer',
  deployment: { appId: 'f5wwuq4fm25p15r0lp8wujkm' },
});
