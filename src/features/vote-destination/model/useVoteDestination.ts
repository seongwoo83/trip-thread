import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	tripId: string;
	memberId: string;
	proposalId: string;
};

export function useVoteDestination() {
	const qc = useQueryClient();

	return useMutation<void, Error, Input>({
		mutationFn: async ({ tripId, memberId, proposalId }) => {
			const { error } = await supabase.from("destination_votes").insert({
				trip_id: tripId,
				member_id: memberId,
				proposal_id: proposalId,
			});
			if (error) throw new Error(error.message);

			// 투표 후 과반수 체크 → 자동 확정
			const [{ data: votes }, { count: memberCount }] = await Promise.all([
				supabase
					.from("destination_votes")
					.select("proposal_id")
					.eq("trip_id", tripId),
				supabase
					.from("trip_members")
					.select("*", { count: "exact", head: true })
					.eq("trip_id", tripId),
			]);

			const votesForProposal =
				votes?.filter((v) => v.proposal_id === proposalId).length ?? 0;

			if (
				memberCount &&
				memberCount > 0 &&
				votesForProposal > memberCount / 2
			) {
				const { data: winning } = await supabase
					.from("destination_proposals")
					.select("name")
					.eq("id", proposalId)
					.single();

				if (winning) {
					await supabase
						.from("trips")
						.update({ destination: winning.name })
						.eq("id", tripId);
				}
			}
		},
		onSuccess: (_data, { tripId }) => {
			qc.invalidateQueries({ queryKey: ["destination-proposals", tripId] });
			qc.invalidateQueries({ queryKey: ["trip-access", tripId] });
		},
	});
}
