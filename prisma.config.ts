import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// The Prisma CLI only reads `.env`, but this project keeps its secrets in
// `.env.local` (loaded by Next at runtime). Reuse Next's own loader here so
// the CLI resolves DATABASE_URL/DIRECT_URL exactly like the app does.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
