"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Shield,
	Users,
	Edit3,
	CheckCircle,
	XCircle,
	UserCog,
	ArrowLeft,
	Activity,
} from "lucide-react";

interface User {
	id: number;
	discordId: string;
	username: string;
	displayName: string;
	customName?: string;
	rank: string;
	department: string;
	isActive: boolean;
	isWebAdmin: boolean;
	totalHours: number;
	createdAt: string;
}

export default function AdminPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [stats, setStats] = useState({
		totalUsers: 0,
		activeUsers: 0,
		webAdmins: 0,
	});
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	// Fetch users data from API
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Check if user is admin
				const authResponse = await fetch("/api/attendance");
				if (authResponse.ok) {
					const authData = await authResponse.json();
					if (!authData.user) {
						window.location.href = "/";
						return;
					}

					setCurrentUser(authData.user);

					// Check if user is admin
					if (
						!authData.user.isWebAdmin &&
						authData.user.rank !== "Direktur" &&
						authData.user.rank !== "Wakdir" &&
						authData.user.rank !== "HRD"
					) {
						alert("Access denied. Admin privileges required.");
						window.location.href = "/dashboard";
						return;
					}
				} else {
					window.location.href = "/";
					return;
				}

				// Fetch users
				const usersResponse = await fetch("/api/admin/users");
				if (usersResponse.ok) {
					const usersData = await usersResponse.json();
					if (usersData.success) {
						setUsers(usersData.users);
						// Calculate stats
						const totalUsers = usersData.users.length;
						const activeUsers = usersData.users.filter(
							(u: User) => u.isActive,
						).length;
						const webAdmins = usersData.users.filter(
							(u: User) => u.isWebAdmin,
						).length;
						setStats({ totalUsers, activeUsers, webAdmins });
					}
				} else {
					const errorData = await usersResponse.json();
					alert(errorData.error || "Failed to load users");
				}
			} catch (error) {
				console.error("Failed to fetch data:", error);
				alert("Failed to load admin data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleUpdateUser = async (updatedUser: User) => {
		try {
			const response = await fetch("/api/admin/users", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: updatedUser.id,
					customName: updatedUser.customName,
					rank: updatedUser.rank,
					department: updatedUser.department,
					isActive: updatedUser.isActive,
					isWebAdmin: updatedUser.isWebAdmin,
				}),
			});

			const data = await response.json();

			if (data.success) {
				// Update local state
				setUsers((prev) =>
					prev.map((user) =>
						user.id === updatedUser.id ? { ...user, ...data.user } : user,
					),
				);
				setIsEditDialogOpen(false);
				setEditingUser(null);
				alert("User updated successfully");
			} else {
				alert(data.error || "Failed to update user");
			}
		} catch (error) {
			console.error("Update user error:", error);
			alert("Failed to update user");
		}
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const getRankColor = (rank: string) => {
		switch (rank) {
			case "Direktur":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "Wakdir":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "HRD":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "Sekretaris":
				return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
			case "Dokter Spesialis":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "Dokter Umum":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "Perawat":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "Trainee":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Activity className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
					<p className="text-muted-foreground">Loading admin panel...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									window.location.href = "/dashboard";
								}}
								className="text-muted-foreground hover:text-foreground"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back to Dashboard
							</Button>
							<div className="flex items-center space-x-2">
								<Shield className="w-6 h-6 text-primary" />
								<div>
									<h1 className="text-xl font-bold text-foreground">
										Admin Panel
									</h1>
									<p className="text-sm text-muted-foreground">
										User Management
									</p>
								</div>
							</div>
						</div>
						{currentUser && (
							<div className="text-right">
								<p className="text-sm font-medium text-foreground">
									{currentUser.displayName}
								</p>
								<p className="text-xs text-muted-foreground">
									{currentUser.rank} • Admin
								</p>
							</div>
						)}
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Users</CardTitle>
							<Users className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalUsers}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Active Users</CardTitle>
							<CheckCircle className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.activeUsers}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Web Admins</CardTitle>
							<UserCog className="w-4 h-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.webAdmins}</div>
						</CardContent>
					</Card>
				</div>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<CardTitle>Users Management</CardTitle>
						<p className="text-sm text-muted-foreground">
							Manage user ranks, permissions, and status
						</p>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Rank</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Total Hours</TableHead>
									<TableHead>Admin</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => (
									<TableRow key={user.id}>
										<TableCell>
											<div>
												<div className="font-medium">
													{user.customName || user.displayName}
												</div>
												<div className="text-sm text-muted-foreground">
													@{user.username} • {user.discordId}
													{user.customName && (
														<span className="block text-xs">
															Discord: {user.displayName}
														</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge className={getRankColor(user.rank)}>
												{user.rank}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center">
												{user.isActive ? (
													<>
														<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
														<span className="text-sm text-green-600">
															Active
														</span>
													</>
												) : (
													<>
														<XCircle className="w-4 h-4 text-red-500 mr-2" />
														<span className="text-sm text-red-600">
															Inactive
														</span>
													</>
												)}
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm">
												{formatDuration(user.totalHours)}
											</span>
										</TableCell>
										<TableCell>
											{user.isWebAdmin ? (
												<Badge variant="secondary">
													<Shield className="w-3 h-3 mr-1" />
													Admin
												</Badge>
											) : (
												<span className="text-sm text-muted-foreground">
													User
												</span>
											)}
										</TableCell>
										<TableCell>
											<Dialog
												open={isEditDialogOpen && editingUser?.id === user.id}
												onOpenChange={(open) => {
													setIsEditDialogOpen(open);
													if (!open) setEditingUser(null);
												}}
											>
												<DialogTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setEditingUser({ ...user });
															setIsEditDialogOpen(true);
														}}
													>
														<Edit3 className="w-4 h-4" />
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															Edit User: {user.username}
														</DialogTitle>
													</DialogHeader>
													{editingUser && (
														<div className="space-y-4">
															<div>
																<label
																	htmlFor="custom-name-input"
																	className="block text-sm font-medium mb-2"
																>
																	Nama Anggota
																</label>
																<input
																	id="custom-name-input"
																	type="text"
																	value={editingUser.customName || ""}
																	onChange={(e) =>
																		setEditingUser({
																			...editingUser,
																			customName: e.target.value,
																		})
																	}
																	placeholder="Masukkan nama lengkap (opsional)"
																	className="w-full p-2 border border-input rounded-md bg-background text-foreground"
																/>
																<p className="text-xs text-muted-foreground mt-1">
																	Jika diisi, nama ini akan ditampilkan menggantikan nama Discord
																</p>
															</div>

															<div>
																<label
																	htmlFor="rank-select"
																	className="block text-sm font-medium mb-2"
																>
																	Jabatan
																</label>
																<Select
																	value={editingUser.rank}
																	onValueChange={(value) =>
																		setEditingUser({
																			...editingUser,
																			rank: value,
																		})
																	}
																>
																	<SelectTrigger id="rank-select">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="Direktur">Direktur</SelectItem>
																		<SelectItem value="Wakdir">Wakdir</SelectItem>
																		<SelectItem value="HRD">HRD</SelectItem>
																		<SelectItem value="Sekretaris">Sekretaris</SelectItem>
																		<SelectItem value="Dokter Spesialis">Dokter Spesialis</SelectItem>
																		<SelectItem value="Dokter Umum">Dokter Umum</SelectItem>
																		<SelectItem value="Perawat">Perawat</SelectItem>
																		<SelectItem value="Trainee">Trainee</SelectItem>
																	</SelectContent>
																</Select>
															</div>

															<div>
																<label
																	htmlFor="department-select"
																	className="block text-sm font-medium mb-2"
																>
																	Department
																</label>
																<Select
																	value={editingUser.department}
																	onValueChange={(value) =>
																		setEditingUser({
																			...editingUser,
																			department: value,
																		})
																	}
																>
																	<SelectTrigger id="department-select">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="EMS">EMS</SelectItem>
																		<SelectItem value="Fire Department">
																			Fire Department
																		</SelectItem>
																		<SelectItem value="SAR">SAR</SelectItem>
																	</SelectContent>
																</Select>
															</div>

															<div className="flex items-center space-x-4">
																<label className="flex items-center">
																	<input
																		type="checkbox"
																		checked={editingUser.isActive}
																		onChange={(e) =>
																			setEditingUser({
																				...editingUser,
																				isActive: e.target.checked,
																			})
																		}
																		className="mr-2"
																	/>
																	<span className="text-sm">Active</span>
																</label>

																<label className="flex items-center">
																	<input
																		type="checkbox"
																		checked={editingUser.isWebAdmin}
																		onChange={(e) =>
																			setEditingUser({
																				...editingUser,
																				isWebAdmin: e.target.checked,
																			})
																		}
																		className="mr-2"
																	/>
																	<span className="text-sm">Web Admin</span>
																</label>
															</div>

															<div className="flex justify-end space-x-3 mt-6">
																<Button
																	variant="outline"
																	onClick={() => {
																		setIsEditDialogOpen(false);
																		setEditingUser(null);
																	}}
																>
																	Cancel
																</Button>
																<Button
																	onClick={() => handleUpdateUser(editingUser)}
																>
																	Save Changes
																</Button>
															</div>
														</div>
													)}
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
