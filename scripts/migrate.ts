import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING;
  if (!rawConnectionString) {
    throw new Error("POSTGRES_URL_NON_POOLING is not set (check .env.local)");
  }
  const connectionString = rawConnectionString.replace(/sslmode=[^&]+/, "sslmode=no-verify");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const dir = path.join(process.cwd(), "supabase", "migrations");
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows: applied } = await client.query<{ name: string }>(
      "select name from public.schema_migrations"
    );
    const appliedNames = new Set(applied.map((r) => r.name));

    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`skip  ${file} (already applied)`);
        continue;
      }
      const sql = readFileSync(path.join(dir, file), "utf8");
      console.log(`apply ${file}`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into public.schema_migrations (name) values ($1)",
          [file]
        );
        await client.query("commit");
        console.log(`done  ${file}`);
      } catch (err) {
        await client.query("rollback");
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }

    console.log("All migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
