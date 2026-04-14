import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        date: z.coerce.date().optional(),
        session: z.number().default(1).optional(),
        duration: z.string().optional(),
        rating: z.number().min(0).max(10).optional(),
        objective: z.string().optional(),
        repos: z.array(z.string()).default([]).optional(),
        tags: z.array(z.string()).default([]).optional(),
        role: z.string().optional(),
        shortcut: z.string().optional(),
        wins: z.array(z.string()).default([]).optional(),
        improvements: z.array(z.string()).default([]).optional(),
        decisions: z.array(z.string()).default([]).optional(),
      }),
    }),
  }),
};
