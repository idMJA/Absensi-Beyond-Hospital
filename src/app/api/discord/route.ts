import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	getUserByDiscordId,
	createUser,
	clockIn,
	clockOut,
	getActiveAttendance,
	getUserAttendanceHistory,
	getLeaderboard,
	getActiveMembers,
} from "@/db";

// Middleware untuk memverifikasi Discord bot token
function verifyBotToken(request: NextRequest): boolean {
	const botToken = request.headers.get("x-bot-token");
	return botToken === process.env.DISCORD_AUTH_API;
}

export async function POST(request: NextRequest) {
	try {
		if (!verifyBotToken(request)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { action, discordId, username } = await request.json();

		if (!discordId) {
			return NextResponse.json(
				{ error: "Discord ID is required" },
				{ status: 400 },
			);
		}

		// Find user by Discord ID
		let user = await getUserByDiscordId(discordId);

		if (!user) {
			// Create new user if doesn't exist
			user = await createUser({
				discordId,
				username: username || `User_${discordId}`,
				displayName: username || `User_${discordId}`,
				rank: "Trainee",
				department: "EMS",
				isActive: true,
				totalHours: 0,
			});
		}

		if (action === "clock_in") {
			try {
				const newAttendance = await clockIn(user.id, user.discordId);
				return NextResponse.json({
					success: true,
					message: `<@${discordId}> berhasil on duty`,
					data: {
						attendance: newAttendance,
						user: {
							username: user.username,
							rank: user.rank,
							totalHours: user.totalHours,
						},
					},
				});
			} catch {
				return NextResponse.json({
					success: false,
					message: `<@${discordId}> sudah on duty sebelumnya`,
					data: {
						isAlreadyClockedIn: true,
					},
				});
			}
		} else if (action === "clock_out") {
			try {
				const updatedAttendance = await clockOut(user.id);
				const duration = updatedAttendance.duration || 0;
				const hours = Math.floor(duration / 60);
				const minutes = duration % 60;
				const durationText = `${hours}h ${minutes}m`;

				return NextResponse.json({
					success: true,
					message: `<@${discordId}> berhasil off duty. Durasi kerja: **${durationText}**`,
					data: {
						attendance: updatedAttendance,
						duration: durationText,
						totalMinutes: duration,
						user: {
							username: user.username,
							rank: user.rank,
							totalHours: (user.totalHours || 0) + duration,
						},
					},
				});
			} catch {
				return NextResponse.json({
					success: false,
					message: `<@${discordId}> belum on duty`,
					data: {
						isNotClockedIn: true,
					},
				});
			}
		} else if (action === "status") {
			// Get user status
			const activeAttendance = await getActiveAttendance(user.id);
			const recentAttendance = await getUserAttendanceHistory(user.id, 5);

			const totalHours = user.totalHours || 0;
			const totalHoursDisplay = `${Math.floor(totalHours / 60)}h ${totalHours % 60}m`;

			return NextResponse.json({
				success: true,
				message: `Status untuk <@${discordId}>`,
				data: {
					user: {
						username: user.username,
						rank: user.rank,
						department: user.department,
						totalHours: totalHoursDisplay,
						isActive: user.isActive,
					},
					activeAttendance,
					recentAttendance,
					isCurrentlyClockedIn: !!activeAttendance,
				},
			});
		} else {
			return NextResponse.json(
				{ error: 'Invalid action. Use "clock_in", "clock_out", or "status"' },
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Discord bot API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		if (!verifyBotToken(request)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");

		if (action === "leaderboard") {
			// Get top users by total hours
			const topUsers = await getLeaderboard(10);

			return NextResponse.json({
				success: true,
				data: {
					leaderboard: topUsers.map((user, index) => ({
						rank: index + 1,
						username: user.username,
						discordId: user.discordId,
						position: user.rank,
						totalHours: `${Math.floor((user.totalHours || 0) / 60)}h ${(user.totalHours || 0) % 60}m`,
						totalMinutes: user.totalHours || 0,
					})),
				},
			});
		}

		if (action === "active_members") {
			// Get currently active members
			const activeMembers = await getActiveMembers();

			return NextResponse.json({
				success: true,
				data: {
					activeMembers: activeMembers.map((member) => {
						const clockInTime = member.clockIn;
						const durationMinutes = clockInTime
							? Math.floor((Date.now() - clockInTime.getTime()) / (1000 * 60))
							: 0;

						return {
							username: member.username,
							discordId: member.discordId,
							rank: member.rank,
							clockInTime: member.clockIn,
							duration: `${durationMinutes} minutes`,
						};
					}),
					count: activeMembers.length,
				},
			});
		}

		return NextResponse.json({
			success: true,
			message: "Available actions: leaderboard, active_members",
		});
	} catch (error) {
		console.error("Discord bot GET API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
