import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = { tripId: string };

export function useConfirmDestination() {
	const qc = useQueryClient();

	return useMutation<void, Error, Input>({
		mutationFn: async ({ tripId }) => {
			// 모든 제안과 투표 가져오기
			const [proposalsRes, votesRes] = await Promise.all([
				supabase
					.from("destination_proposals")
					.select("id, name, created_at")
					.eq("trip_id", tripId)
					.order("created_at", { ascending: true }),
				supabase
					.from("destination_votes")
					.select("proposal_id")
					.eq("trip_id", tripId),
			]);

			const proposals = proposalsRes.data ?? [];
			const votes = votesRes.data ?? [];

			if (proposals.length === 0) throw new Error("제안된 여행지가 없어요");

			// 득표 수 계산 (동률이면 먼저 제안한 것이 created_at 순이라 앞에 위치)
			const winner = proposals.reduce((best, p) => {
				const count = votes.filter((v) => v.proposal_id === p.id).length;
				const bestCount = votes.filter((v) => v.proposal_id === best.id).length;
				return count > bestCount ? p : best;
			});

			await supabase
				.from("trips")
				.update({ destination: winner.name })
				.eq("id", tripId);
		},
		onSuccess: (_data, { tripId }) => {
			qc.invalidateQueries({ queryKey: ["destination-proposals", tripId] });
			qc.invalidateQueries({ queryKey: ["trip-access", tripId] });
		},
	});
}
