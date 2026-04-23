import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/api";
import { getLocalTripIds, syncLocalTripIds } from "@/entities/trip";

export function useLeaveTrip() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async ({
			tripId,
			memberId,
		}: {
			tripId: string;
			memberId: string;
		}) => {
			const { error } = await supabase
				.from("trip_members")
				.delete()
				.eq("id", memberId)
				.eq("trip_id", tripId);

			if (error) throw new Error(error.message);

			// localStorage 정리
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
