import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

export function useRealtimePosts(tripId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		const channel = supabase
			.channel(`posts:trip:${tripId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "posts",
					filter: `trip_id=eq.${tripId}`,
				},
				(payload) => {
					queryClient.invalidateQueries({ queryKey: ["posts", tripId] });
					const changedId =
						(payload.new as { id?: string } | null)?.id ??
						(payload.old as { id?: string } | null)?.id;
					if (changedId) {
						queryClient.invalidateQueries({ queryKey: ["post", changedId] });
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [tripId, queryClient]);
}
