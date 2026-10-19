import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output only. Spec §Global Constraints: no runtime backend, no API
// routes, no server. The federated Worker proxy is phase 4 and lives in a
// separate deployable, not here.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
  },
});