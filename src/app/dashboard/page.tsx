"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Clock,
	Users,
	Calendar,
	Trophy,
	User,
	LogIn,
	LogOut,
	BarChart3,
	Activity,
} from "lucide-react";

interface UserData {
	id: number;
	discordId: string;
	username: string;
	displayName: string;
	customName?: string;
	rank: string;
	department: string;
	totalHours: number;
	isWebAdmin?: boolean;
}

interface Attendance {
	id: number;
	clockIn: string;
	clockOut?: string;
	duration?: number;
	status: string;
}

export default function Dashboard() {
	const [user, setUser] = useState<UserData | null>(null);
	const [activeAttendance, setActiveAttendance] = useState<Attendance | null>(
		null,
	);
	const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	const handleLogout = async () => {
		setIsLoading(true);
		try {
			// Call logout API
			await fetch("/api/auth/discord", { method: "POST" });

			// Clear local state
			setUser(null);
			setActiveAttendance(null);
			setAttendanceHistory([]);

			// Redirect to login
			window.location.href = "/";
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClockIn = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/attendance", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ action: "clock_in" }),
			});

			const data = await response.json();

			if (data.success) {
				setActiveAttendance(data.attendance);
				await fetchAttendanceData();
			} else {
				alert(data.error || "Failed to clock in");
			}
		} catch (error) {
			console.error("Clock in error:", error);
			alert("Failed to clock in. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClockOut = async () => {
		if (!activeAttendance) return;

		setIsLoading(true);
		try {
			const response = await fetch("/api/attendance", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ action: "clock_out" }),
			});

			const data = await response.json();

			if (data.success) {
				setActiveAttendance(null);
				setAttendanceHistory((prev) => [data.attendance, ...prev]);

				// Update user's total hours
				if (user && data.attendance.duration) {
					setUser((prev) =>
						prev
							? {
									...prev,
									totalHours: (prev.totalHours || 0) + data.attendance.duration,
								}
							: null,
					);
				}
			} else {
				alert(data.error || "Failed to clock out");
			}
		} catch (error) {
			console.error("Clock out error:", error);
			alert("Failed to clock out. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const fetchAttendanceData = async () => {
		try {
			const response = await fetch("/api/attendance");
			if (response.ok) {
				const data = await response.json();
				setActiveAttendance(data.activeAttendance);
				setAttendanceHistory(data.attendanceHistory || []);
			}
		} catch (error) {
			console.error("Failed to fetch attendance data:", error);
		}
	};

	const getCurrentShiftDuration = () => {
		if (!activeAttendance) return "0m";
		const now = new Date();
		const clockIn = new Date(activeAttendance.clockIn);
		const duration = Math.floor(
			(now.getTime() - clockIn.getTime()) / (1000 * 60),
		);
		return formatDuration(duration);
	};

	useEffect(() => {
		// Check for user session and load data
		const initializeData = async () => {
			try {
				const response = await fetch("/api/attendance");
				if (response.ok) {
					const data = await response.json();
					if (data.user) {
						setUser(data.user);
						setActiveAttendance(data.activeAttendance);
						setAttendanceHistory(data.attendanceHistory || []);
					} else {
						// No user session, redirect to login
						window.location.href = "/";
					}
				} else {
					// Not authenticated, redirect to login
					window.location.href = "/";
				}
			} catch (error) {
				console.error("Failed to initialize data:", error);
				// Error occurred, redirect to login
				window.location.href = "/";
			} finally {
				setIsInitialLoading(false);
			}
		};

		initializeData();
	}, []);

	if (isInitialLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Activity className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
					<p className="text-muted-foreground text-lg">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // Will redirect to login
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-4">
							<Activity className="w-8 h-8 text-primary" />
							<div>
								<h1 className="text-xl font-bold text-foreground">Beyond EMS</h1>
								<p className="text-sm text-muted-foreground">
									Emergency Medical Services
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<div className="text-right">
								<p className="text-foreground font-medium">
									{user.customName || user.displayName}
								</p>
								<p className="text-sm text-muted-foreground">
									{user.rank} • {user.department}
								</p>
							</div>
							{user.isWebAdmin && (
								<Button
									onClick={() => {
										window.location.href = "/admin";
									}}
									variant="outline"
									size="sm"
								>
									Admin
								</Button>
							)}
							<Button
								onClick={handleLogout}
								variant="outline"
								size="sm"
							>
								<LogOut className="w-4 h-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Status Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Status</CardTitle>
							<Clock
								className={`w-4 h-4 ${activeAttendance ? "text-green-500" : "text-muted-foreground"}`}
							/>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{activeAttendance ? "On Duty" : "Off Duty"}
							</div>
							{activeAttendance && (
								<p className="text-xs text-green-600 mt-1">
									Shift: {getCurrentShiftDuration()}
								</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Jam</CardTitle>
							<BarChart3 className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatDuration(user.totalHours)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Rank</CardTitle>
							<Trophy className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{user.rank}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Shift Bulan Ini
							</CardTitle>
							<Calendar className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{attendanceHistory.length}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Clock In/Out Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Clock className="w-5 h-5 mr-2" />
								Absensi
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{activeAttendance ? (
								<div className="space-y-4">
									<div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
										<h3 className="text-green-800 dark:text-green-200 font-medium mb-2">
											Sedang Bertugas
										</h3>
										<div className="space-y-2 text-sm">
											<div className="flex items-center text-green-700 dark:text-green-300">
												<Clock className="w-4 h-4 mr-2" />
												Clock In:{" "}
												{new Date(activeAttendance.clockIn).toLocaleString(
													"id-ID",
												)}
											</div>
											<div className="flex items-center text-green-700 dark:text-green-300">
												<Activity className="w-4 h-4 mr-2" />
												Status: On Duty
											</div>
										</div>
									</div>

									<Button
										onClick={handleClockOut}
										disabled={isLoading}
										className="w-full"
										variant="destructive"
									>
										<LogOut className="w-5 h-5 mr-2" />
										{isLoading ? "Processing..." : "Clock Out"}
									</Button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="bg-muted border rounded-lg p-4">
										<h3 className="text-muted-foreground font-medium mb-2">
											Tidak Sedang Bertugas
										</h3>
										<p className="text-muted-foreground text-sm">
											Klik tombol Clock In untuk memulai shift Anda
										</p>
									</div>

									<Button
										onClick={handleClockIn}
										disabled={isLoading}
										className="w-full"
									>
										<LogIn className="w-5 h-5 mr-2" />
										{isLoading ? "Processing..." : "Clock In"}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Recent Activity */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Users className="w-5 h-5 mr-2" />
								Aktivitas Terkini
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{attendanceHistory.slice(0, 5).map((attendance) => (
									<div
										key={attendance.id}
										className="bg-muted/50 rounded-lg p-3 border"
									>
										<div className="flex justify-between items-start">
											<div className="space-y-1">
												<p className="font-medium text-sm">
													Shift #{attendance.id}
												</p>
												<p className="text-muted-foreground text-xs">
													{new Date(attendance.clockIn).toLocaleDateString(
														"id-ID",
													)}
												</p>
											</div>
											<div className="text-right">
												<p className="text-green-600 text-sm font-medium">
													{attendance.duration
														? formatDuration(attendance.duration)
														: "Ongoing"}
												</p>
												<Badge variant="secondary" className="text-xs">
													{attendance.status}
												</Badge>
											</div>
										</div>
									</div>
								))}

								{attendanceHistory.length === 0 && (
									<div className="text-center text-muted-foreground py-8">
										<User className="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p>Belum ada aktivitas</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Quick Info */}
				<Card>
					<CardHeader>
						<CardTitle>Informasi Discord Bot</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h3 className="text-lg font-semibold mb-2">
									Commands untuk Discord Bot:
								</h3>
								<div className="space-y-2 text-sm">
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											!clockin
										</code>{" "}
										- Clock in untuk memulai shift
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											!clockout
										</code>{" "}
										- Clock out untuk mengakhiri shift
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">!status</code>{" "}
										- Cek status absensi Anda
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											!leaderboard
										</code>{" "}
										- Top 10 EMS berdasarkan jam kerja
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">!active</code>{" "}
										- Lihat anggota yang sedang bertugas
									</p>
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">
									API Endpoints:
								</h3>
								<div className="space-y-2 text-sm">
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											POST /api/discord
										</code>{" "}
										- Bot commands
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											GET /api/discord?action=leaderboard
										</code>{" "}
										- Leaderboard
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											GET /api/discord?action=active_members
										</code>{" "}
										- Active members
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
