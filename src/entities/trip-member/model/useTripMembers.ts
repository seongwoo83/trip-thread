import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

export type TripMemberItem = {
	id: string;
	nickname: string;
	role: "host" | "member";
	created_at: string;
};

export function useTripMembers(tripId: string) {
	return useQuery({
		queryKey: ["trip-members", tripId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("trip_members")
				.select("id, nickname, role, created_at")
				.eq("trip_id", tripId)
				.order("created_at", { ascending: true });

			if (error) throw error;
			return data as TripMemberItem[];
		},
		enabled: !!tripId,
	});
}
