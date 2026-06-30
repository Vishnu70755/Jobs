import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./src";

// Run migrations
async function main() {
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();