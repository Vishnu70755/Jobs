"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSchedulerConfigSchema = exports.schedulerConfigTable = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
exports.schedulerConfigTable = (0, pg_core_1.pgTable)("scheduler_config", {
    id: (0, pg_core_1.integer)("id").primaryKey().default(1),
    lastRun: (0, pg_core_1.timestamp)("last_run"),
    nextRun: (0, pg_core_1.timestamp)("next_run"),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).default("idle"),
    jobsImportedToday: (0, pg_core_1.integer)("jobs_imported_today").default(0),
    totalImported: (0, pg_core_1.integer)("total_imported").default(0),
    durationMs: (0, pg_core_1.integer)("duration_ms"),
    errors: (0, pg_core_1.text)("errors"),
    retryCount: (0, pg_core_1.integer)("retry_count").default(0),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
// Insert schemas
exports.insertSchedulerConfigSchema = (0, drizzle_zod_1.createInsertSchema)(exports.schedulerConfigTable).omit({ id: true, updatedAt: true });
