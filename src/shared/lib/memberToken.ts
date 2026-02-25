const TOKEN_KEY_PREFIX = "trip-thread:token:";

export function getMemberToken(tripId: string): string | null {
	return localStorage.getItem(`${TOKEN_KEY_PREFIX}${tripId}`);
}

export function setMemberToken(tripId: string, token: string): void {
	localStorage.setItem(`${TOKEN_KEY_PREFIX}${tripId}`, token);
}
