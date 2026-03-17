import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

export function useRealtimeComments(postId: string, tripId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		const channel = supabase
			.channel(`comments:post:${postId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "comments",
					filter: `post_id=eq.${postId}`,
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ["comments", postId] });
					// 피드의 댓글 수도 동기화
					queryClient.invalidateQueries({ queryKey: ["posts", tripId] });
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [postId, tripId, queryClient]);
}
