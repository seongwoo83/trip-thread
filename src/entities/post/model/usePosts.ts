import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { PostWithMeta } from "./types";

export function usePosts(tripId: string) {
	return useQuery<PostWithMeta[]>({
		queryKey: ["posts", tripId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("posts")
				.select(
					`*, author:trip_members!posts_author_id_fkey(id, nickname), comments(count)`,
				)
				.eq("trip_id", tripId)
				.order("created_at", { ascending: false });

			if (error) throw new Error(error.message);

			return (data ?? []).map((row) => {
				const r = row as typeof row & {
					author: { id: string; nickname: string };
					comments: { count: number }[];
				};
				return {
					...r,
					author: r.author,
					comment_count: r.comments[0]?.count ?? 0,
				};
			});
		},
		enabled: !!tripId,
	});
}
