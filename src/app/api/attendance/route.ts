import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	clockIn,
	clockOut,
	getUserById,
	getActiveAttendance,
	getUserAttendanceHistory,
} from "@/db";

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
	const sessionCookie = request.cookies.get("user_session");
	if (!sessionCookie) {
		return null;
	}

	try {
		const session = JSON.parse(sessionCookie.value);
		return session;
	} catch {
		return null;
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getUserFromSession(request);
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { action } = await request.json();

		if (action === "clock_in") {
			try {
				const newAttendance = await clockIn(user.id, user.discordId);
				return NextResponse.json({
					success: true,
					message: "Successfully clocked in",
					attendance: newAttendance,
				});
			} catch (error) {
				return NextResponse.json(
					{
						error:
							error instanceof Error ? error.message : "Failed to clock in",
					},
					{ status: 400 },
				);
			}
		} else if (action === "clock_out") {
			try {
				const updatedAttendance = await clockOut(user.id);
				const duration = updatedAttendance.duration || 0;
				return NextResponse.json({
					success: true,
					message: "Successfully clocked out",
					attendance: updatedAttendance,
					duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
				});
			} catch (error) {
				return NextResponse.json(
					{
						error:
							error instanceof Error ? error.message : "Failed to clock out",
					},
					{ status: 400 },
				);
			}
		} else {
			return NextResponse.json(
				{ error: 'Invalid action. Use "clock_in" or "clock_out"' },
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Attendance error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const sessionUser = await getUserFromSession(request);
		if (!sessionUser) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		// Always fetch the latest user data from DB
		const user = await getUserById(sessionUser.id);
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = parseInt(searchParams.get("offset") || "0");

		// Get user's attendance history
		const attendanceHistory = await getUserAttendanceHistory(
			user.id,
			limit,
			offset,
		);

		// Get active attendance if any
		const activeAttendance = await getActiveAttendance(user.id);

		return NextResponse.json({
			success: true,
			user,
			activeAttendance,
			attendanceHistory,
			pagination: {
				limit,
				offset,
				hasMore: attendanceHistory.length === limit,
			},
		});
	} catch (error) {
		console.error("Get attendance error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
