import { NextResponse } from "next/server";

export async function POST() {
	// Clear session cookies
	const response = NextResponse.json({ success: true });
	response.cookies.set({
		name: "user_session",
		value: "",
		httpOnly: true,
		expires: new Date(0),
		path: "/",
	});
	response.cookies.set({
		name: "discord_access_token",
		value: "",
		httpOnly: true,
		expires: new Date(0),
		path: "/",
	});
	return response;
}
