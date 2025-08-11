import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import * as schema from "./schema";

// Validate environment variables
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
	throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
}

// Create the database client
const client = createClient({
	url,
	authToken,
});

// Create the database instance with schema
export const db = drizzle(client, { schema });

// Export schema types for easy access
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Attendance = typeof schema.attendance.$inferSelect;
export type NewAttendance = typeof schema.attendance.$inferInsert;
export type LeaveRequest = typeof schema.leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof schema.leaveRequests.$inferInsert;

// User functions
export async function createUser(userData: NewUser) {
	return db.insert(schema.users).values(userData).returning().get();
}

export async function getUserByDiscordId(discordId: string) {
	return db
		.select()
		.from(schema.users)
		.where(eq(schema.users.discordId, discordId))
		.get();
}

export async function getUserById(id: number) {
	return db.select().from(schema.users).where(eq(schema.users.id, id)).get();
}

export async function updateUser(id: number, userData: Partial<NewUser>) {
	return db
		.update(schema.users)
		.set({ ...userData, updatedAt: new Date() })
		.where(eq(schema.users.id, id))
		.returning()
		.get();
}

export async function getAllUsers(limit = 50, offset = 0) {
	return db
		.select()
		.from(schema.users)
		.limit(limit)
		.offset(offset)
		.orderBy(desc(schema.users.createdAt));
}

export async function getActiveUsers() {
	return db
		.select()
		.from(schema.users)
		.where(eq(schema.users.isActive, true))
		.orderBy(desc(schema.users.totalHours));
}

// Attendance functions
export async function clockIn(userId: number, discordId: string) {
	// Check if already clocked in
	const activeAttendance = await getActiveAttendance(userId);
	if (activeAttendance) {
		throw new Error("User is already clocked in");
	}

	return db
		.insert(schema.attendance)
		.values({
			userId,
			discordId,
			clockIn: new Date(),
			status: "active",
		})
		.returning()
		.get();
}

export async function clockOut(userId: number) {
	const activeAttendance = await getActiveAttendance(userId);
	if (!activeAttendance) {
		throw new Error("No active attendance found");
	}

	const clockOutTime = new Date();
	const clockInTime = activeAttendance.clockIn;
	if (!clockInTime) {
		throw new Error("Invalid clock in time");
	}
	const duration = Math.floor(
		(clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60),
	);

	// Update attendance
	const updatedAttendance = await db
		.update(schema.attendance)
		.set({
			clockOut: clockOutTime,
			duration,
			status: "completed",
			updatedAt: new Date(),
		})
		.where(eq(schema.attendance.id, activeAttendance.id))
		.returning()
		.get();

	// Update user's total hours
	const user = await getUserById(userId);
	if (user) {
		await updateUser(userId, {
			totalHours: (user.totalHours || 0) + duration,
		});
	}

	return updatedAttendance;
}

export async function getActiveAttendance(userId: number) {
	return db
		.select()
		.from(schema.attendance)
		.where(
			and(
				eq(schema.attendance.userId, userId),
				eq(schema.attendance.status, "active"),
				isNull(schema.attendance.clockOut),
			),
		)
		.get();
}

export async function getUserAttendanceHistory(
	userId: number,
	limit = 10,
	offset = 0,
) {
	return db
		.select()
		.from(schema.attendance)
		.where(eq(schema.attendance.userId, userId))
		.limit(limit)
		.offset(offset)
		.orderBy(desc(schema.attendance.clockIn));
}

export async function getActiveMembers() {
	return db
		.select({
			username: schema.users.username,
			discordId: schema.users.discordId,
			rank: schema.users.rank,
			clockIn: schema.attendance.clockIn,
		})
		.from(schema.users)
		.innerJoin(schema.attendance, eq(schema.users.id, schema.attendance.userId))
		.where(
			and(
				eq(schema.users.isActive, true),
				eq(schema.attendance.status, "active"),
				isNull(schema.attendance.clockOut),
			),
		);
}

export async function getLeaderboard(limit = 10) {
	return db
		.select({
			username: schema.users.username,
			discordId: schema.users.discordId,
			rank: schema.users.rank,
			totalHours: schema.users.totalHours,
		})
		.from(schema.users)
		.where(eq(schema.users.isActive, true))
		.orderBy(desc(schema.users.totalHours))
		.limit(limit);
}

// Leave request functions
export async function createLeaveRequest(data: NewLeaveRequest) {
	return db.insert(schema.leaveRequests).values(data).returning().get();
}

export async function getUserLeaveRequests(userId: number, status?: string) {
	let whereClause = eq(schema.leaveRequests.userId, userId);

	if (status) {
		const statusClause = and(
			whereClause,
			eq(schema.leaveRequests.status, status),
		);
		if (statusClause) {
			whereClause = statusClause;
		}
	}

	return db
		.select()
		.from(schema.leaveRequests)
		.where(whereClause)
		.orderBy(desc(schema.leaveRequests.createdAt));
}

export async function approveLeaveRequest(id: number, approvedBy: number) {
	return db
		.update(schema.leaveRequests)
		.set({
			status: "approved",
			approvedBy,
			approvedAt: new Date(),
		})
		.where(eq(schema.leaveRequests.id, id))
		.returning()
		.get();
}

export async function rejectLeaveRequest(
	id: number,
	approvedBy: number,
	reason: string,
) {
	return db
		.update(schema.leaveRequests)
		.set({
			status: "rejected",
			approvedBy,
			approvedAt: new Date(),
			rejectionReason: reason,
		})
		.where(eq(schema.leaveRequests.id, id))
		.returning()
		.get();
}

// Admin log functions
export async function createAdminLog(data: {
	adminId: number;
	action: string;
	targetId?: number;
	targetType?: string;
	details?: object;
	ipAddress?: string;
	userAgent?: string;
}) {
	return db
		.insert(schema.adminLogs)
		.values({
			adminId: data.adminId,
			action: data.action,
			targetId: data.targetId,
			targetType: data.targetType,
			details: data.details ? JSON.stringify(data.details) : null,
			ipAddress: data.ipAddress,
			userAgent: data.userAgent,
		})
		.returning()
		.get();
}

export async function getAdminLogs(limit = 100, offset = 0) {
	return db
		.select()
		.from(schema.adminLogs)
		.limit(limit)
		.offset(offset)
		.orderBy(desc(schema.adminLogs.createdAt));
}

// Performance metrics functions
export async function updatePerformanceMetrics(
	userId: number,
	month: number,
	year: number,
	metrics: {
		totalHours?: number;
		attendanceRate?: number;
		punctualityScore?: number;
		totalCalls?: number;
		rating?: number;
	},
) {
	const existing = await db
		.select()
		.from(schema.performanceMetrics)
		.where(
			and(
				eq(schema.performanceMetrics.userId, userId),
				eq(schema.performanceMetrics.month, month),
				eq(schema.performanceMetrics.year, year),
			),
		)
		.get();

	if (existing) {
		return db
			.update(schema.performanceMetrics)
			.set(metrics)
			.where(eq(schema.performanceMetrics.id, existing.id))
			.returning()
			.get();
	} else {
		return db
			.insert(schema.performanceMetrics)
			.values({
				userId,
				month,
				year,
				...metrics,
			})
			.returning()
			.get();
	}
}

export async function getUserPerformanceMetrics(userId: number, year?: number) {
	let whereClause = eq(schema.performanceMetrics.userId, userId);

	if (year) {
		const yearClause = and(
			whereClause,
			eq(schema.performanceMetrics.year, year),
		);
		if (yearClause) {
			whereClause = yearClause;
		}
	}

	return db
		.select()
		.from(schema.performanceMetrics)
		.where(whereClause)
		.orderBy(
			desc(schema.performanceMetrics.year),
			desc(schema.performanceMetrics.month),
		);
}

// Auth functions
export async function loginOrCreateUser(userData: {
	discordId: string;
	username: string;
	displayName?: string;
}) {
	// Check if user exists
	let user = await getUserByDiscordId(userData.discordId);

	if (!user) {
		// Create new user
		user = await createUser({
			discordId: userData.discordId,
			username: userData.username,
			displayName: userData.displayName || userData.username,
			rank: "Trainee",
			department: "EMS",
			isActive: true,
			totalHours: 0,
		});
	} else {
		// Update existing user info
		user = await updateUser(user.id, {
			username: userData.username,
			displayName: userData.displayName || userData.username,
		});
	}

	return user;
}

// Statistics functions
export async function getTotalStats() {
	const totalUsers = await db
		.select({ count: sql`count(*)` })
		.from(schema.users)
		.get();
	const activeUsers = await db
		.select({ count: sql`count(*)` })
		.from(schema.users)
		.where(eq(schema.users.isActive, true))
		.get();
	const currentlyOnDuty = await db
		.select({ count: sql`count(*)` })
		.from(schema.attendance)
		.where(
			and(
				eq(schema.attendance.status, "active"),
				isNull(schema.attendance.clockOut),
			),
		)
		.get();

	return {
		totalUsers: totalUsers?.count || 0,
		activeUsers: activeUsers?.count || 0,
		currentlyOnDuty: currentlyOnDuty?.count || 0,
	};
}

export default db;
