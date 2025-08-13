"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar24 } from "@/components/ui/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
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
	// State untuk modal edit duty
	const [editModalOpen, setEditModalOpen] = useState(false);
	// State untuk edit duty
	const [editDutyId, setEditDutyId] = useState<number | null>(null);
	const [editClockInDate, setEditClockInDate] = useState<Date | undefined>(
		undefined,
	);
	const [editClockInTime, setEditClockInTime] = useState<string>("");
	const [editClockOutDate, setEditClockOutDate] = useState<Date | undefined>(
		undefined,
	);
	const [editClockOutTime, setEditClockOutTime] = useState<string>("");
	const [editLoading, setEditLoading] = useState(false);

	// Fungsi untuk mulai edit duty
	const startEditDuty = (attendance: Attendance) => {
		setEditDutyId(attendance.id);
		if (attendance.clockIn) {
			const clockInDateObj = new Date(attendance.clockIn);
			setEditClockInDate(clockInDateObj);
			setEditClockInTime(clockInDateObj.toTimeString().slice(0, 8));
		} else {
			setEditClockInDate(undefined);
			setEditClockInTime("");
		}
		if (attendance.clockOut) {
			const clockOutDateObj = new Date(attendance.clockOut);
			setEditClockOutDate(clockOutDateObj);
			setEditClockOutTime(clockOutDateObj.toTimeString().slice(0, 8));
		} else {
			setEditClockOutDate(undefined);
			setEditClockOutTime("");
		}
		setEditModalOpen(true);
	};

	// Fungsi untuk simpan perubahan duty
	const saveEditDuty = async () => {
		if (!editDutyId) return;
		setEditLoading(true);
		try {
			// Gabungkan date dan time menjadi ISO string
			let clockInISO = null;
			let clockOutISO = null;
			if (editClockInDate && editClockInTime) {
				const [h, m, s] = editClockInTime.split(":");
				const d = new Date(editClockInDate);
				d.setHours(Number(h), Number(m), Number(s));
				clockInISO = d.toISOString();
			}
			if (editClockOutDate && editClockOutTime) {
				const [h, m, s] = editClockOutTime.split(":");
				const d = new Date(editClockOutDate);
				d.setHours(Number(h), Number(m), Number(s));
				clockOutISO = d.toISOString();
			}
			const response = await fetch("/api/attendance/edit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: editDutyId,
					clockIn: clockInISO,
					clockOut: clockOutISO,
				}),
			});
			const data = await response.json();
			if (data.success) {
				setAttendanceHistory((prev) =>
					prev.map((att) =>
						att.id === editDutyId
							? {
									...att,
									clockIn: clockInISO || att.clockIn,
									clockOut: clockOutISO || att.clockOut,
								}
							: att,
					),
				);
				setEditDutyId(null);
			} else {
				alert(data.error || "Gagal menyimpan perubahan duty");
			}
		} catch {
			alert("Gagal menyimpan perubahan duty");
		} finally {
			setEditLoading(false);
		}
	};
	const [user, setUser] = useState<UserData | null>(null);
	const [activeAttendance, setActiveAttendance] = useState<Attendance | null>(
		null,
	);
	const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

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

	// Hitung total jam pada minggu berjalan (Senin-Minggu)
	const getWeeklyHours = (history: Attendance[]) => {
		const now = new Date();
		// Cari hari Senin minggu ini
		const dayOfWeek = now.getDay(); // 0 = Minggu, 1 = Senin, ...
		// Jika hari Minggu (0), maka minggu berjalan mulai dari Senin sebelumnya
		const monday = new Date(now);
		monday.setHours(0, 0, 0, 0);
		if (dayOfWeek === 0) {
			// Minggu, mundur 6 hari ke Senin
			monday.setDate(now.getDate() - 6);
		} else {
			// Hari lain, mundur ke Senin minggu ini
			monday.setDate(now.getDate() - (dayOfWeek - 1));
		}
		// Minggu depan (untuk batas akhir)
		const nextMonday = new Date(monday);
		nextMonday.setDate(monday.getDate() + 7);
		return history
			.filter((att) => {
				const clockInDate = new Date(att.clockIn);
				return clockInDate >= monday && clockInDate < nextMonday;
			})
			.reduce((sum, att) => sum + (att.duration || 0), 0);
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
			{/* Navbar */}
			<Navbar />

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
							<CardTitle className="text-sm font-medium">
								Total Jam Minggu Ini
							</CardTitle>
							<BarChart3 className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatDuration(getWeeklyHours(attendanceHistory))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Jabatan</CardTitle>
							<Trophy className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{user.rank}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Duty Bulan Ini
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
								Duty
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
										{isLoading ? "Processing..." : "Off Duty"}
									</Button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="bg-muted border rounded-lg p-4">
										<h3 className="text-muted-foreground font-medium mb-2">
											Tidak Sedang On Duty
										</h3>
										<p className="text-muted-foreground text-sm">
											Klik tombol On Duty untuk memulai duty Anda
										</p>
									</div>

									<Button
										onClick={handleClockIn}
										disabled={isLoading}
										className="w-full"
									>
										<LogIn className="w-5 h-5 mr-2" />
										{isLoading ? "Processing..." : "On Duty"}
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
													Duty #{attendance.id}
												</p>
												<p className="text-muted-foreground text-xs">
													Clock In:{" "}
													{attendance.clockIn
														? new Date(attendance.clockIn).toLocaleString(
																"id-ID",
																{
																	hour: "2-digit",
																	minute: "2-digit",
																	second: "2-digit",
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																},
															)
														: "-"}
												</p>
												<p className="text-muted-foreground text-xs">
													Clock Out:{" "}
													{attendance.clockOut
														? new Date(attendance.clockOut).toLocaleString(
																"id-ID",
																{
																	hour: "2-digit",
																	minute: "2-digit",
																	second: "2-digit",
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																},
															)
														: "-"}
												</p>
												<Button
													size="sm"
													variant="outline"
													className="mt-2"
													onClick={() => startEditDuty(attendance)}
												>
													Edit
												</Button>
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
								{/* Modal Edit Duty, hanya satu kali di luar map */}
								<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Edit Duty</DialogTitle>
										</DialogHeader>
										<div className="space-y-4">
											<div>
												<span className="block text-xs text-muted-foreground mb-1">
													Clock In:
												</span>
												<Calendar24
													date={editClockInDate}
													setDate={setEditClockInDate}
													time={editClockInTime}
													setTime={setEditClockInTime}
												/>
												{editDutyId !== null && (
													<div className="text-xs text-muted-foreground mt-1">
														Duty sebelumnya: {(() => {
															const att = attendanceHistory.find(
																(a) => a.id === editDutyId,
															);
															return att?.clockIn
																? new Date(att.clockIn).toLocaleString(
																		"id-ID",
																		{
																			hour: "2-digit",
																			minute: "2-digit",
																			second: "2-digit",
																			day: "2-digit",
																			month: "2-digit",
																			year: "numeric",
																		},
																	)
																: "-";
														})()}
													</div>
												)}
											</div>
											<div>
												<span className="block text-xs text-muted-foreground mb-1">
													Clock Out:
												</span>
												<Calendar24
													date={editClockOutDate}
													setDate={setEditClockOutDate}
													time={editClockOutTime}
													setTime={setEditClockOutTime}
												/>
												{editDutyId !== null && (
													<div className="text-xs text-muted-foreground mt-1">
														Duty sebelumnya: {(() => {
															const att = attendanceHistory.find(
																(a) => a.id === editDutyId,
															);
															return att?.clockOut
																? new Date(att.clockOut).toLocaleString(
																		"id-ID",
																		{
																			hour: "2-digit",
																			minute: "2-digit",
																			second: "2-digit",
																			day: "2-digit",
																			month: "2-digit",
																			year: "numeric",
																		},
																	)
																: "-";
														})()}
													</div>
												)}
											</div>
										</div>
										<DialogFooter>
											<Button
												size="sm"
												onClick={saveEditDuty}
												disabled={editLoading}
											>
												{editLoading ? "Menyimpan..." : "Simpan"}
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setEditDutyId(null);
													setEditModalOpen(false);
												}}
											>
												Batal
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

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
										<code className="bg-muted px-2 py-1 rounded text-xs">
											!status
										</code>{" "}
										- Cek status absensi Anda
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											!leaderboard
										</code>{" "}
										- Top 10 EMS berdasarkan jam kerja
									</p>
									<p className="text-muted-foreground">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											!active
										</code>{" "}
										- Lihat anggota yang sedang bertugas
									</p>
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">API Endpoints:</h3>
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
