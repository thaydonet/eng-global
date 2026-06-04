import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  anh6: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh6' }),
    schema: z.record(z.any()),
  }),
  anh7: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh7' }),
    schema: z.record(z.any()),
  }),
  anh8: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh8' }),
    schema: z.record(z.any()),
  }),
  anh9: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh9' }),
    schema: z.record(z.any()),
  }),
  anh10: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh10' }),
    schema: z.record(z.any()),
  }),
  anh11: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh11' }),
    schema: z.record(z.any()),
  }),
  anh12: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh12' }),
    schema: z.record(z.any()),
  }),
};
