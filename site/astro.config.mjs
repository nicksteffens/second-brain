import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nicksteffens.github.io',
  base: '/second-brain',
  integrations: [
    starlight({
      title: 'Second Brain',
      description: 'Session logs and project notes by Nick Steffens',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/nicksteffens/second-brain' },
      ],
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'Timeline', link: '/timeline/' },
        { label: 'Tags', link: '/tags/' },
        {
          label: '2026',
          autogenerate: { directory: '2026', collapsed: true },
        },
        {
          label: '2025',
          autogenerate: { directory: '2025', collapsed: true },
        },
      ],
    }),
  ],
});
