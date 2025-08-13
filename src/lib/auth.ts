import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is not defined");
}

export interface JWTPayload {
	userId: number;
	discordId: string;
	username: string;
	rank: string;
	iat?: number;
	exp?: number;
}

export const generateToken = (
	payload: Omit<JWTPayload, "iat" | "exp">,
): string => {
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: "7d",
		issuer: "beyond-ems-absensi",
	});
};

export const verifyToken = (token: string): JWTPayload | null => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
		return decoded;
	} catch (error) {
		console.error("Token verification failed:", error);
		return null;
	}
};

export const hashPassword = async (password: string): Promise<string> => {
	const saltRounds = 12;
	return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
	password: string,
	hash: string,
): Promise<boolean> => {
	return bcrypt.compare(password, hash);
};

export const generateDiscordAuthURL = (): string => {
	const clientId = process.env.DISCORD_CLIENT_ID;
	if (!clientId) {
		throw new Error("DISCORD_CLIENT_ID environment variable is not defined");
	}
	const redirectUri = encodeURIComponent(
		`${process.env.NEXT_PUBLIC_APP_URL}/auth/discord/callback`,
	);
	const scopes = encodeURIComponent("identify email guilds");

	return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
};
