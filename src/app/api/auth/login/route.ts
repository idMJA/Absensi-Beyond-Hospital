import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		const { discordId, username, displayName, email } = await request.json();

		if (!discordId || !username) {
			return NextResponse.json(
				{ error: "Discord ID and username are required" },
				{ status: 400 },
			);
		}

		// Check if user exists
		let user = await db
			.select()
			.from(users)
			.where(eq(users.discordId, discordId))
			.get();

		if (!user) {
			// Create new user
			const newUser = await db
				.insert(users)
				.values({
					discordId,
					username,
					displayName: displayName || username,
					rank: "Rookie",
					department: "EMS",
					isActive: true,
					totalHours: 0,
				})
				.returning()
				.get();

			user = newUser;
		} else {
			// Update existing user info
			user = await db
				.update(users)
				.set({
					username,
					displayName: displayName || username,
					updatedAt: new Date(),
				})
				.where(eq(users.id, user.id))
				.returning()
				.get();
		}

		// Generate JWT token
		const token = generateToken({
			userId: user.id,
			discordId: user.discordId,
			username: user.username,
			rank: user.rank,
		});

		return NextResponse.json({
			success: true,
			token,
			user: {
				id: user.id,
				discordId: user.discordId,
				username: user.username,
				displayName: user.displayName,
				rank: user.rank,
				department: user.department,
				totalHours: user.totalHours,
			},
		});
	} catch (error) {
		console.error("Auth error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
