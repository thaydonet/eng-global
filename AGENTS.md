# AGENTS — Agent Instructions for this repository

Purpose: help AI coding agents get productive quickly in this Astro + TypeScript project.

Quick Start
- **Install:** `npm install`
- **Dev:** `npm run dev` (local server)
- **Build:** `npm run build`

Important Files & Links
- **package.json:** [package.json](package.json)
- **README:** [README.md](README.md)
- **Astro config:** [astro.config.mjs](astro.config.mjs)
- **TypeScript config:** [tsconfig.json](tsconfig.json)
- **Tailwind config:** [tailwind.config.mjs](tailwind.config.mjs)
- **Content:** [src/content/](src/content/)
- **Components:** [src/components/](src/components/)
- **Data:** [src/data/](src/data/)
- **Generators:** [scripts/](scripts/) (Python generators create JSON lesson files)
- **DB schema:** [supabase_exam_schema.sql](supabase_exam_schema.sql)
- **Public assets:** [public/](public/)

Conventions & Notes for agents
- This is an Astro site with React/TSX components under `src/components/`.
- Lesson/content JSON lives in `src/content/` organized by grade (anh6–anh12).
- Python scripts in `scripts/` generate or repair content JSON — prefer running those scripts rather than hand-editing generated files.
- Tailwind is configured in `tailwind.config.mjs`; keep classes utility-first.
- Supabase is used for backend/auth — see `lib/supabase.ts` and the SQL schema for DB expectations.
- No CI config discovered; run basic commands locally when validating changes.

When to ask the human
- Any changes that modify content generation logic, DB schema, or deployment settings.
- If Python environment (version/deps) is required to run `scripts/`, confirm the runtime and virtualenv approach.

Suggested next agent customizations
- `create-skill:content-generator` — skill to run and validate Python content generators.
- `create-hook:dev-start` — hook that runs `npm install` then `npm run dev` and reports status.
- `create-instruction:frontend` — short developer-facing instructions for editing TSX components and content JSON.

Maintainer: keep this file minimal and link to deeper docs rather than copying them.
