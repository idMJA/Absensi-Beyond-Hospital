import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAllUsers, updateUser, getUserById } from "@/db";

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

// Check if user is admin (isWebAdmin or rank Direktur/Wakdir/HRD)
function isAdmin(
	user: { rank?: string; isWebAdmin?: boolean } | null,
): boolean {
	return (
		user !== null &&
		(user.isWebAdmin === true ||
			user.rank === "Direktur" ||
			user.rank === "Wakdir" ||
			user.rank === "HRD")
	);
}

export async function GET(request: NextRequest) {
	try {
		const user = await getUserFromSession(request);
		if (!user || !isAdmin(user)) {
			return NextResponse.json(
				{ error: "Admin access required" },
				{ status: 403 },
			);
		}

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = parseInt(searchParams.get("offset") || "0");

		// Get all users
		const allUsers = await getAllUsers(limit, offset);

		return NextResponse.json({
			success: true,
			users: allUsers,
			pagination: {
				limit,
				offset,
				hasMore: allUsers.length === limit,
			},
		});
	} catch (error) {
		console.error("Get users error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const user = await getUserFromSession(request);
		if (!user || !isAdmin(user)) {
			return NextResponse.json(
				{ error: "Admin access required" },
				{ status: 403 },
			);
		}

		const { userId, customName, rank, department, isActive, isWebAdmin } =
			await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		// Check if user exists
		const existingUser = await getUserById(userId);
		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Update user
		const updatedUser = await updateUser(userId, {
			customName: customName || null,
			rank: rank || existingUser.rank,
			department: department || existingUser.department,
			isActive: isActive !== undefined ? isActive : existingUser.isActive,
			isWebAdmin:
				isWebAdmin !== undefined ? isWebAdmin : existingUser.isWebAdmin,
		});

		if (!updatedUser) {
			return NextResponse.json(
				{ error: "Failed to update user" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "User updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Update user error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
