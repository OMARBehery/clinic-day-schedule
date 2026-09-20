import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgres?: ReturnType<typeof postgres>;
};

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function getSql() {
  if (!globalForDb.postgres) {
    globalForDb.postgres = postgres(getDatabaseUrl(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return globalForDb.postgres;
}

export function getDb() {
  return drizzle(getSql(), { schema });
}

export async function closeDb() {
  if (globalForDb.postgres) {
    await globalForDb.postgres.end({ timeout: 5 });
    globalForDb.postgres = undefined;
  }
}

export type Database = ReturnType<typeof getDb>;
