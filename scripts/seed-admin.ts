import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

function toInternalEmail(username: string) {
  const domain = process.env.APP_AUTH_EMAIL_DOMAIN || "users.internal";
  return `${username.toLowerCase()}@${domain}`;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "Admin";

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (check .env.local)");
  }
  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD not set (check .env.local)");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = toInternalEmail(username);

  // Idempotent: if a profile with this username already exists, skip.
  const { data: existing } = await admin
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    console.log(`Admin user "${username}" already exists (id=${existing.id}). Skipping.`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, name, role: "ADMIN" },
  });

  if (error) {
    throw new Error(`Failed to create admin user: ${error.message}`);
  }

  console.log("Seeded admin user:");
  console.log(`  username: ${username}`);
  console.log(`  password: ${password}`);
  console.log(`  user id:  ${data.user?.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
