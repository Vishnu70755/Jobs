"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schedulerConfig_1 = require("./schedulerConfig");
var drizzle_zod_1 = require("drizzle-zod");
try {
    var insertSchedulerConfigSchema = (0, drizzle_zod_1.createInsertSchema)(schedulerConfig_1.schedulerConfigTable).omit({ id: true, updatedAt: true });
    console.log('SUCCESS: Schema created successfully without Unrecognized key error');
}
catch (error) {
    console.error('ERROR: ', error.message);
}
