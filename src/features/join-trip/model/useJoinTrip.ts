import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { addLocalTripId } from "@/entities/trip";
import type { Trip } from "@/entities/trip";

export function useJoinTrip() {
	const qc = useQueryClient();

	return useMutation<Trip, Error, string>({
		mutationFn: async (code: string) => {
			const { data, error } = await supabase
				.from("trips")
				.select("*")
				.eq("invite_code", code.toUpperCase())
				.single();

			if (error || !data) throw new Error("유효하지 않은 초대 코드예요");
			addLocalTripId(data.id);
			return data as Trip;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-trips"] });
		},
	});
}
