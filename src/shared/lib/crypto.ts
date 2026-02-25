const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // confusing chars (0,O,I,1) excluded

export function generateInviteCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return Array.from(bytes)
		.map((b) => INVITE_CHARS[b % INVITE_CHARS.length])
		.join("");
}

export function generateRecoveryCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(12));
	return Array.from(bytes)
		.map((b) => INVITE_CHARS[b % INVITE_CHARS.length])
		.join("");
}

export function generateToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function hashToken(token: string): Promise<string> {
	const data = new TextEncoder().encode(token);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** "ABCDEFGHIJKL" → "ABCD-EFGH-IJKL" (display only) */
export function formatRecoveryCode(code: string): string {
	return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}
