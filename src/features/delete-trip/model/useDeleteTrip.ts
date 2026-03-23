import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/api";
import { getLocalTripIds, syncLocalTripIds } from "@/entities/trip";

async function deleteTripStorage(tripId: string) {
	const { data: files } = await supabase.storage
		.from("trip-photos")
		.list(tripId);
	if (files && files.length > 0) {
		const paths = files.map((f) => `${tripId}/${f.name}`);
		await supabase.storage.from("trip-photos").remove(paths);
	}
}

export function useDeleteTrip() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (tripId: string) => {
			// 1. Storage 이미지 전체 삭제
			await deleteTripStorage(tripId);

			// 2. destination_votes 삭제
			await supabase.from("destination_votes").delete().eq("trip_id", tripId);

			// 3. destination_proposals 삭제
			await supabase
				.from("destination_proposals")
				.delete()
				.eq("trip_id", tripId);

			// 4. posts 삭제 (comments는 ON DELETE CASCADE로 자동 삭제)
			await supabase.from("posts").delete().eq("trip_id", tripId);

			// 5. trip_members 삭제
			await supabase.from("trip_members").delete().eq("trip_id", tripId);

			// 6. trip 삭제
			const { error } = await supabase.from("trips").delete().eq("id", tripId);
			if (error) throw new Error(error.message);

			// 7. localStorage 정리
			localStorage.removeItem(`trip-thread:token:${tripId}`);
			const ids = getLocalTripIds().filter((id) => id !== tripId);
			syncLocalTripIds(ids);
		},
		onSuccess: () => {
			queryClient.clear();
			navigate("/");
		},
	});
}
