"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
const pg_1 = require("pg");
const path_1 = require("path");
async function runMigrations(databaseUrl) {
    const pool = new pg_1.Pool({ connectionString: databaseUrl });
    try {
        await (0, migrator_1.migrate)((0, node_postgres_1.drizzle)(pool), { migrationsFolder: (0, path_1.join)(__dirname, '../../drizzle') });
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    const url = process.env.DATABASE_URL;
    if (!url)
        throw new Error('DATABASE_URL is required');
    runMigrations(url)
        .then(() => console.log('Migrations applied'))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map