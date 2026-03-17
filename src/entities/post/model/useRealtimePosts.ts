import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { PostWithMeta } from "./types";

type PostsCache = InfiniteData<PostWithMeta[]>;

export function useRealtimePosts(tripId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		const channel = supabase
			.channel(`posts:trip:${tripId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "posts",
					filter: `trip_id=eq.${tripId}`,
				},
				async (payload) => {
					const newId = (payload.new as { id: string }).id;

					// 이미 캐시에 있으면 스킵 (mutation onSuccess invalidate와 중복 방지)
					const cached = queryClient.getQueryData<PostsCache>([
						"posts",
						tripId,
					]);
					if (cached?.pages.some((page) => page.some((p) => p.id === newId)))
						return;

					const { data } = await supabase
						.from("posts")
						.select(
							`*, author:trip_members!posts_author_id_fkey(id, nickname), comments(count)`,
						)
						.eq("id", newId)
						.single();

					if (!data) return;

					const r = data as typeof data & {
						author: { id: string; nickname: string };
						comments: { count: number }[];
					};
					const newPost: PostWithMeta = {
						...r,
						author: r.author,
						comment_count: r.comments[0]?.count ?? 0,
					};

					queryClient.setQueryData<PostsCache>(["posts", tripId], (old) => {
						if (!old) return old;
						return {
							...old,
							pages: [[newPost, ...old.pages[0]], ...old.pages.slice(1)],
						};
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "posts",
					filter: `trip_id=eq.${tripId}`,
				},
				(payload) => {
					const updated = payload.new as {
						id: string;
						content: string;
						image_url: string | null;
					};

					queryClient.setQueryData<PostsCache>(["posts", tripId], (old) => {
						if (!old) return old;
						return {
							...old,
							pages: old.pages.map((page) =>
								page.map((post) =>
									post.id === updated.id
										? {
												...post,
												content: updated.content,
												image_url: updated.image_url,
											}
										: post,
								),
							),
						};
					});

					queryClient.invalidateQueries({ queryKey: ["post", updated.id] });
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "posts",
					filter: `trip_id=eq.${tripId}`,
				},
				(payload) => {
					const deletedId = (payload.old as { id: string }).id;

					queryClient.setQueryData<PostsCache>(["posts", tripId], (old) => {
						if (!old) return old;
						return {
							...old,
							pages: old.pages.map((page) =>
								page.filter((post) => post.id !== deletedId),
							),
						};
					});

					queryClient.removeQueries({ queryKey: ["post", deletedId] });
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [tripId, queryClient]);
}
