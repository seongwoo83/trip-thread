import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	tripId: string;
	memberId: string;
	name: string;
};

export function useProposeDestination() {
	const qc = useQueryClient();

	return useMutation<void, Error, Input>({
		mutationFn: async ({ tripId, memberId, name }) => {
			const { error } = await supabase.from("destination_proposals").insert({
				trip_id: tripId,
				proposed_by: memberId,
				name: name.trim(),
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: (_data, { tripId }) => {
			qc.invalidateQueries({ queryKey: ["destination-proposals", tripId] });
		},
	});
}
