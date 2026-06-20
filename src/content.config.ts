import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  anh6: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh6' }),
    schema: z.object({}).passthrough(),
  }),
  anh7: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh7' }),
    schema: z.object({}).passthrough(),
  }),
  anh8: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh8' }),
    schema: z.object({}).passthrough(),
  }),
  anh9: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh9' }),
    schema: z.object({}).passthrough(),
  }),
  anh10: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh10' }),
    schema: z.object({}).passthrough(),
  }),
  anh11: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh11' }),
    schema: z.object({}).passthrough(),
  }),
  anh12: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/anh12' }),
    schema: z.object({}).passthrough(),
  }),
};
