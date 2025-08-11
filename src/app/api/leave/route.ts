import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const token = authHeader?.replace("Bearer ", "");

		if (!token) {
			return NextResponse.json(
				{ error: "Authorization token required" },
				{ status: 401 },
			);
		}

		const payload = verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		const { startDate, endDate, reason, type } = await request.json();

		if (!startDate || !endDate || !reason || !type) {
			return NextResponse.json(
				{ error: "All fields are required" },
				{ status: 400 },
			);
		}

		const validTypes = ["sick", "vacation", "personal", "emergency"];
		if (!validTypes.includes(type)) {
			return NextResponse.json(
				{ error: "Invalid leave type" },
				{ status: 400 },
			);
		}

		// Create leave request
		const newLeaveRequest = await db
			.insert(leaveRequests)
			.values({
				userId: payload.userId,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				reason,
				type,
				status: "pending",
			})
			.returning()
			.get();

		return NextResponse.json({
			success: true,
			message: "Leave request submitted successfully",
			leaveRequest: newLeaveRequest,
		});
	} catch (error) {
		console.error("Leave request error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const token = authHeader?.replace("Bearer ", "");

		if (!token) {
			return NextResponse.json(
				{ error: "Authorization token required" },
				{ status: 401 },
			);
		}

		const payload = verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = parseInt(searchParams.get("offset") || "0");

		let whereClause = eq(leaveRequests.userId, payload.userId);

		if (status) {
			const statusClause = and(whereClause, eq(leaveRequests.status, status));
			if (statusClause) {
				whereClause = statusClause;
			}
		}

		const userLeaveRequests = await db
			.select()
			.from(leaveRequests)
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(leaveRequests.createdAt);

		return NextResponse.json({
			success: true,
			leaveRequests: userLeaveRequests,
			pagination: {
				limit,
				offset,
				hasMore: userLeaveRequests.length === limit,
			},
		});
	} catch (error) {
		console.error("Get leave requests error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
