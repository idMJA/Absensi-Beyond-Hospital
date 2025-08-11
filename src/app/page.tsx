"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	LogIn,
	Activity,
} from "lucide-react";

export default function Home() {
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	const handleLogin = async () => {
		setIsLoading(true);
		try {
			// Redirect to Discord OAuth
			window.location.href = "/api/auth/discord";
		} catch (error) {
			console.error("Login error:", error);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// Check if user is already logged in
		const checkAuthStatus = async () => {
			try {
				const response = await fetch("/api/attendance");
				if (response.ok) {
					const data = await response.json();
					if (data.user) {
						// User is logged in, redirect to dashboard
						window.location.href = "/dashboard";
						return;
					}
				}
			} catch (error) {
				console.error("Failed to check auth status:", error);
			} finally {
				setIsCheckingAuth(false);
			}
		};

		checkAuthStatus();
	}, []);

	if (isCheckingAuth) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Activity className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
					<p className="text-muted-foreground text-lg">Checking authentication...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-4">
					<div className="flex justify-center">
						<div className="p-6 bg-primary/10 rounded-full">
							<Activity className="w-12 h-12 text-primary" />
						</div>
					</div>
					<CardTitle className="text-4xl font-bold">Beyond EMS</CardTitle>
					<div className="space-y-2">
						<p className="text-xl text-muted-foreground">
							Sistem Absensi Emergency Medical Services
						</p>
						<p className="text-primary">Beyond Roleplay Server</p>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button
						onClick={handleLogin}
						disabled={isLoading}
						size="lg"
						className="w-full"
					>
						<LogIn className="w-5 h-5 mr-2" />
						{isLoading ? "Connecting..." : "Login dengan Discord"}
					</Button>

					<p className="text-sm text-muted-foreground text-center">
						Masuk menggunakan akun Discord Anda untuk mengakses sistem absensi
						EMS
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
