import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { addLocalTripId } from "@/entities/trip";
import type { Trip } from "@/entities/trip";

type CreateTripInput = {
	name: string;
	destination: string;
	start_date: string;
	end_date: string;
};

function generateInviteCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useCreateTrip() {
	const qc = useQueryClient();

	return useMutation<Trip, Error, CreateTripInput>({
		mutationFn: async (input) => {
			const invite_code = generateInviteCode();
			const { data, error } = await supabase
				.from("trips")
				.insert({ ...input, invite_code })
				.select()
				.single();

			if (error) throw new Error(error.message);
			addLocalTripId(data.id);
			return data as Trip;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-trips"] });
		},
	});
}
