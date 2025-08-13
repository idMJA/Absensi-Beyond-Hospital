"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Activity, Shield, ArrowLeft } from "lucide-react";

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

interface NavbarProps {
	showBackButton?: boolean;
	onBack?: () => void;
}

export function Navbar({ showBackButton = false, onBack }: NavbarProps) {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await fetch("/api/attendance");
				if (response.ok) {
					const data = await response.json();
					if (data.user) {
						setUser(data.user);
					} else {
						// No user session, redirect to login
						window.location.href = "/";
					}
				} else {
					// Not authenticated, redirect to login
					window.location.href = "/";
				}
			} catch (error) {
				console.error("Failed to fetch user data:", error);
				// Error occurred, redirect to login
				window.location.href = "/";
			} finally {
				setLoading(false);
			}
		};

		fetchUserData();
	}, []);

	const handleLogout = async () => {
		try {
			// Call logout API
			await fetch("/api/auth/discord", { method: "POST" });

			// Redirect to login
			window.location.href = "/";
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const handleAdminClick = () => {
		window.location.href = "/admin";
	};

	const handleBackClick = () => {
		if (onBack) {
			onBack();
		} else {
			window.location.href = "/dashboard";
		}
	};

	// Check if user has admin privileges
	const hasAdminAccess =
		user?.isWebAdmin ||
		user?.rank === "Direktur" ||
		user?.rank === "Wakdir" ||
		user?.rank === "HRD";

	// Show loading state or redirect if no user
	if (loading || !user) {
		return null;
	}

	return (
		<header className="border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-4">
					<div className="flex items-center space-x-4">
						{showBackButton && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleBackClick}
								className="text-muted-foreground hover:text-foreground"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back to Dashboard
							</Button>
						)}
						<div className="flex items-center space-x-2">
							{showBackButton ? (
								<Shield className="w-6 h-6 text-primary" />
							) : (
								<Activity className="w-8 h-8 text-primary" />
							)}
							<div>
								<h1 className="text-xl font-bold text-foreground">
									{showBackButton ? "Admin Panel" : "Beyond EMS"}
								</h1>
								<p className="text-sm text-muted-foreground">
									{showBackButton
										? "User Management"
										: "Emergency Medical Services"}
								</p>
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<div className="text-right">
							<p className="text-foreground font-medium">
								{user.customName || user.displayName}
							</p>
							<p className="text-sm text-muted-foreground">
								{user.rank} • {user.department}
								{showBackButton && " • Admin"}
							</p>
						</div>
						{hasAdminAccess && !showBackButton && (
							<Button onClick={handleAdminClick} variant="outline" size="sm">
								Admin
							</Button>
						)}
						<Button onClick={handleLogout} variant="outline" size="sm">
							<LogOut className="w-4 h-4 mr-2" />
							Logout
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
