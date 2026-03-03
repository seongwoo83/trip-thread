import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { getDeviceId, getMemberToken, hashToken } from "@/shared/lib";
import type { Trip, TripMember } from "./types";

type AccessStatus = "loading" | "authorized" | "unauthorized" | "not-found";

type TripAccessResult = {
	status: AccessStatus;
	trip: Trip | null;
	member: Pick<TripMember, "id" | "nickname" | "role"> | null;
};

export function useTripAccess(tripId: string | undefined): TripAccessResult {
	const { data, isPending } = useQuery({
		queryKey: ["trip-access", tripId],
		queryFn: async () => {
			if (!tripId) return null;

			const memberToken = getMemberToken(tripId);
			if (!memberToken) return "unauthorized" as const;

			const deviceId = getDeviceId();
			const { data, error } = await supabase
				.from("trip_members")
				.select("id, nickname, role, member_token_hash, trips(*)")
				.eq("trip_id", tripId)
				.eq("device_id", deviceId)
				.maybeSingle();

			if (error || !data) return "not-found" as const;

			const tokenHash = await hashToken(memberToken);
			if (tokenHash !== data.member_token_hash) return "unauthorized" as const;

			const row = data as unknown as {
				id: string;
				nickname: string;
				role: "host" | "member";
				member_token_hash: string;
				trips: Trip;
			};

			return {
				trip: row.trips,
				member: { id: row.id, nickname: row.nickname, role: row.role },
			};
		},
		enabled: !!tripId,
	});

	if (isPending) return { status: "loading", trip: null, member: null };
	if (!data) return { status: "not-found", trip: null, member: null };
	if (data === "unauthorized") return { status: "unauthorized", trip: null, member: null };
	if (data === "not-found") return { status: "not-found", trip: null, member: null };

	return { status: "authorized", trip: data.trip, member: data.member };
}
