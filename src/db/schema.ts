import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Users table untuk menyimpan data anggota EMS
export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	discordId: text("discord_id").unique().notNull(),
	username: text("username").notNull(),
	displayName: text("display_name").notNull(),
	customName: text("custom_name"), // Nama kustom yang diset oleh admin
	rank: text("rank").notNull().default("Trainee"), // Direktur, Wakdir, HRD, Sekretaris, Dokter Spesialis, Dokter Umum, Perawat, Trainee
	isWebAdmin: integer("is_web_admin", { mode: "boolean" }).default(false), // Admin web atau bukan
	department: text("department").notNull().default("EMS"), // EMS, Fire Department, etc
	joinDate: integer("join_date", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	isActive: integer("is_active", { mode: "boolean" }).default(true),
	totalHours: integer("total_hours").default(0), // Total jam kerja dalam menit
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Attendance table untuk menyimpan data absensi
export const attendance = sqliteTable("attendance", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	discordId: text("discord_id").notNull(),
	clockIn: integer("clock_in", { mode: "timestamp" }).notNull(),
	clockOut: integer("clock_out", { mode: "timestamp" }),
	duration: integer("duration"), // Durasi dalam menit
	status: text("status").notNull().default("active"), // active, completed, cancelled
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Shift schedule table untuk jadwal shift
export const shifts = sqliteTable("shifts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	shiftName: text("shift_name").notNull(), // Morning, Afternoon, Night
	startTime: text("start_time").notNull(), // Format HH:MM
	endTime: text("end_time").notNull(), // Format HH:MM
	dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
	isActive: integer("is_active", { mode: "boolean" }).default(true),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Leave requests table untuk cuti/izin
export const leaveRequests = sqliteTable("leave_requests", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	startDate: integer("start_date", { mode: "timestamp" }).notNull(),
	endDate: integer("end_date", { mode: "timestamp" }).notNull(),
	reason: text("reason").notNull(),
	type: text("type").notNull(), // sick, vacation, personal, emergency
	status: text("status").notNull().default("pending"), // pending, approved, rejected
	approvedBy: integer("approved_by").references(() => users.id),
	approvedAt: integer("approved_at", { mode: "timestamp" }),
	rejectionReason: text("rejection_reason"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Performance metrics table untuk tracking performa
export const performanceMetrics = sqliteTable("performance_metrics", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	month: integer("month").notNull(), // 1-12
	year: integer("year").notNull(),
	totalHours: integer("total_hours").default(0),
	attendanceRate: integer("attendance_rate").default(0), // Percentage * 100
	punctualityScore: integer("punctuality_score").default(0), // Percentage * 100
	totalCalls: integer("total_calls").default(0),
	rating: integer("rating").default(0), // 1-5 stars * 100
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Admin logs untuk audit trail
export const adminLogs = sqliteTable("admin_logs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	adminId: integer("admin_id")
		.references(() => users.id)
		.notNull(),
	action: text("action").notNull(), // create_user, update_attendance, approve_leave, etc
	targetId: integer("target_id"), // ID of affected record
	targetType: text("target_type"), // users, attendance, leave_requests, etc
	details: text("details"), // JSON string with additional details
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type NewPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type AdminLog = typeof adminLogs.$inferSelect;
export type NewAdminLog = typeof adminLogs.$inferInsert;
