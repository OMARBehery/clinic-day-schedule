import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(url, { max: 1 });
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    const applied = await sql<{ id: string }[]>`
      SELECT id FROM schema_migrations WHERE id = '0000_init'
    `;

    if (applied.length === 0) {
      const file = path.join(process.cwd(), "drizzle", "0000_init.sql");
      const contents = readFileSync(file, "utf8");
      await sql.unsafe(contents);
      await sql`INSERT INTO schema_migrations (id) VALUES ('0000_init')`;
      console.log("Applied migration 0000_init");
    } else {
      console.log("Migration 0000_init already applied");
    }
  } finally {
    await sql.end();
  }
}

migrate().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
