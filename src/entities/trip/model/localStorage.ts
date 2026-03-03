const LOCAL_KEY = "trip-thread:trip-ids";

export function getLocalTripIds(): string[] {
	try {
		return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
	} catch {
		return [];
	}
}

export function addLocalTripId(id: string): void {
	const ids = getLocalTripIds();
	if (!ids.includes(id)) {
		localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids, id]));
	}
}

export function syncLocalTripIds(ids: string[]): void {
	localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}
