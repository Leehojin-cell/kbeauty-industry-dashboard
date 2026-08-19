import { sql } from "@vercel/postgres";

export function dbConfigured() {
  return Boolean(process.env.POSTGRES_URL);
}

export { sql };
