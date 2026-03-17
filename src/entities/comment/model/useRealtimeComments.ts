import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

// entities 간 cross-import 없이 필요한 필드만 타입 선언
type PostRow = { id: string; comment_count: number };
type PostsCache = InfiniteData<PostRow[]>;

function updateCommentCount(
	queryClient: ReturnType<typeof useQueryClient>,
	tripId: string,
	postId: string,
	delta: 1 | -1,
) {
	queryClient.setQueryData<PostsCache>(["posts", tripId], (old) => {
		if (!old) return old;
		return {
			...old,
			pages: old.pages.map((page) =>
				page.map((post) =>
					post.id === postId
						? {
								...post,
								comment_count: Math.max(0, post.comment_count + delta),
							}
						: post,
				),
			),
		};
	});
}

export function useRealtimeComments(postId: string, tripId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		const channel = supabase
			.channel(`comments:post:${postId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "comments",
					filter: `post_id=eq.${postId}`,
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ["comments", postId] });
					updateCommentCount(queryClient, tripId, postId, 1);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "comments",
					filter: `post_id=eq.${postId}`,
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ["comments", postId] });
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "comments",
					filter: `post_id=eq.${postId}`,
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ["comments", postId] });
					updateCommentCount(queryClient, tripId, postId, -1);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [postId, tripId, queryClient]);
}
