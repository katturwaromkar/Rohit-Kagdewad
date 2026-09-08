import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const DEFAULT_DB_URL = "postgresql://postgres.vqmjtzviwnjommhbjuho:Rohit%21%40%23123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

function getDatabaseUrl(): string {
  let url = (process.env.DATABASE_URL || "").trim();
  // Strip surrounding quotes if accidentally included in Vercel UI
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  return url || DEFAULT_DB_URL;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
