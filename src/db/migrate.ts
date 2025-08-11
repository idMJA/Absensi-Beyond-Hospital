import { db } from "./index";

async function runMigrations() {
	console.log("🔄 Running database migrations...");

	try {
		// Create tables if they don't exist
		await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        display_name TEXT NOT NULL,
        rank TEXT NOT NULL DEFAULT 'Rookie',
        is_web_admin INTEGER DEFAULT 0,
        department TEXT NOT NULL DEFAULT 'EMS',
        join_date INTEGER DEFAULT (unixepoch()),
        is_active INTEGER DEFAULT 1,
        total_hours INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

		await db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        discord_id TEXT NOT NULL,
        clock_in INTEGER NOT NULL,
        clock_out INTEGER,
        duration INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

		await db.run(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        shift_name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        day_of_week INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

		await db.run(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        reason TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approved_at INTEGER,
        rejection_reason TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

		await db.run(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        total_hours INTEGER DEFAULT 0,
        attendance_rate INTEGER DEFAULT 0,
        punctuality_score INTEGER DEFAULT 0,
        total_calls INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

		await db.run(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        target_id INTEGER,
        target_type TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

		console.log("✅ Database migrations completed successfully!");

		// Insert default admin user if no users exist
		const userCount = (await db.get("SELECT COUNT(*) as count FROM users")) as {
			count: number;
		};
		if (userCount && userCount.count === 0) {
			console.log("👤 Creating default admin user...");
			await db.run(`
        INSERT INTO users (discord_id, username, display_name, rank, is_web_admin, department, is_active, total_hours)
        VALUES ('DEFAULT_ADMIN', 'DefaultAdmin', 'Default Admin#0000', 'Chief', 1, 'EMS', 1, 0)
      `);
			console.log("✅ Default admin user created!");
		}
	} catch (error) {
		console.error("❌ Error running migrations:", error);
		throw error;
	}
}

// Auto-run migrations when this module is imported
runMigrations().catch(console.error);

export { runMigrations };
