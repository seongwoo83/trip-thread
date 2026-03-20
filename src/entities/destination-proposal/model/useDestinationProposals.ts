import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type {
	DestinationProposal,
	DestinationVote,
	ProposalWithVotes,
} from "./types";

type Result = {
	proposals: ProposalWithVotes[];
	totalVotes: number;
	myVotedProposalId: string | null;
};

export function useDestinationProposals(
	tripId: string,
	memberId: string,
): Result {
	const qc = useQueryClient();

	useEffect(() => {
		if (!tripId) return;

		const channel = supabase
			.channel(`destination-proposals:${tripId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "destination_proposals",
					filter: `trip_id=eq.${tripId}`,
				},
				() => {
					qc.invalidateQueries({
						queryKey: ["destination-proposals", tripId],
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "destination_votes",
					filter: `trip_id=eq.${tripId}`,
				},
				() => {
					qc.invalidateQueries({
						queryKey: ["destination-proposals", tripId],
					});
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [tripId, qc]);

	const { data } = useQuery<Result>({
		queryKey: ["destination-proposals", tripId],
		queryFn: async () => {
			const [proposalsRes, votesRes] = await Promise.all([
				supabase
					.from("destination_proposals")
					.select("*")
					.eq("trip_id", tripId)
					.order("created_at", { ascending: true }),
				supabase.from("destination_votes").select("*").eq("trip_id", tripId),
			]);

			const proposals = (proposalsRes.data ?? []) as DestinationProposal[];
			const votes = (votesRes.data ?? []) as DestinationVote[];

			const totalVotes = votes.length;
			const myVotedProposalId =
				votes.find((v) => v.member_id === memberId)?.proposal_id ?? null;

			const proposalsWithVotes: ProposalWithVotes[] = proposals.map((p) => ({
				...p,
				voteCount: votes.filter((v) => v.proposal_id === p.id).length,
				hasMyVote: votes.some(
					(v) => v.proposal_id === p.id && v.member_id === memberId,
				),
			}));

			return { proposals: proposalsWithVotes, totalVotes, myVotedProposalId };
		},
		enabled: !!tripId && !!memberId,
	});

	return data ?? { proposals: [], totalVotes: 0, myVotedProposalId: null };
}
