# AI assistance disclosure

This submission was built with assistance from **Cursor Grok 4.6** (an AI coding agent) inside Cursor.

## What the model generated

- Project scaffolding (Next.js, Drizzle, Docker Compose, CI)
- REST handlers, Zod contracts, and the Postgres exclusion-constraint migration
- React schedule UI, Cornerstone3D viewer wiring, tests, and documentation drafts

## What a human reviewer should still verify

- The overlap rule against real concurrent requests (the Vitest race is the automated check)
- That the DICOM image actually renders in a browser (WebGL + workers)
- Timezone behavior if the clinic is not `Africa/Cairo`
- That no secrets were committed and the Vercel env vars are set
- Wording in the README and Architecture section matches the running code

The author remains responsible for the behavior of the submitted system. This is not a diagnostic medical device.
