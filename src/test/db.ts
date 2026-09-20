import { afterAll } from "vitest";
import { closeDb, getSql } from "@/server/db/client";

export async function postgresAvailable() {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  try {
    await getSql()`select 1`;
    return true;
  } catch {
    return false;
  }
}

afterAll(async () => {
  await closeDb();
});
