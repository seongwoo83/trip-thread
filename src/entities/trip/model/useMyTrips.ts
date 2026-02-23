import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { getLocalTripIds } from "./localStorage";
import type { Trip } from "./types";

export function useMyTrips() {
	return useQuery<Trip[]>({
		queryKey: ["my-trips"],
		queryFn: async () => {
			const ids = getLocalTripIds();
			if (ids.length === 0) return [];

			const { data, error } = await supabase
				.from("trips")
				.select("*")
				.in("id", ids)
				.order("created_at", { ascending: false });

			if (error) throw new Error(error.message);
			return data ?? [];
		},
	});
}
